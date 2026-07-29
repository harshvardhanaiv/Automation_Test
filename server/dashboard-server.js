const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8282;
const WORKSPACE_DIR = path.join(__dirname, '..');
const TESTS_DIR = path.join(WORKSPACE_DIR, 'tests');
const CONFIG_FILE = path.join(WORKSPACE_DIR, 'test-execution-config.json');
const REPORTS_DIR = path.join(WORKSPACE_DIR, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/reports', express.static(REPORTS_DIR));

// ── SSE (Server-Sent Events) Setup ──────────────────────────────────────────────
let sseClients = [];

function sendSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => res.write(payload));
}

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('retry: 1000\n\n');
  sseClients.push(res);

  // Send current execution state on connect
  res.write(`event: state\ndata: ${JSON.stringify(currentExecutionState)}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// ── Execution State ─────────────────────────────────────────────────────────────
let activeProcess = null;
let currentExecutionState = {
  status: 'idle', // 'idle' | 'running' | 'completed' | 'stopped'
  startTime: null,
  durationMs: 0,
  browser: 'chromium',
  headed: false,
  totalTests: 0,
  completedTests: 0,
  passedCount: 0,
  failedCount: 0,
  currentTest: '',
  reportPath: '',
  logs: []
};

// ── Helper: Recursive Test Scanner ─────────────────────────────────────────────
function scanTestFiles(dir, relativeDir = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativeDir, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results = results.concat(scanTestFiles(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push({
        path: `tests/${relPath}`,
        name: entry.name,
        section: relativeDir ? relativeDir.replace(/\\/g, '/') : 'root'
      });
    }
  }
  return results;
}

// ── Helper: Config Reader/Writer with Auto-Discovery Sync ───────────────────────
function getExecutionConfig() {
  const allTests = scanTestFiles(TESTS_DIR);
  const scannedSectionsMap = {};

  allTests.forEach(test => {
    const sec = test.section;
    if (!scannedSectionsMap[sec]) {
      scannedSectionsMap[sec] = [];
    }
    scannedSectionsMap[sec].push(test.path);
  });

  let existingSequence = [];
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.sequence)) {
        existingSequence = parsed.sequence;
      }
    } catch (e) {
      console.error('Error reading config file:', e);
    }
  }

  const updatedSequence = [];
  const processedSections = new Set();

  // 1. Preserve existing sequence order, sync tests in existing sections
  existingSequence.forEach(secObj => {
    const secName = secObj.name;
    processedSections.add(secName);

    if (scannedSectionsMap[secName]) {
      const scannedTests = scannedSectionsMap[secName];
      const existingTests = secObj.tests || [];

      // Keep existing test order, filter out deleted ones, append new tests
      const validExisting = existingTests.filter(t => scannedTests.includes(t));
      const newDiscovered = scannedTests.filter(t => !validExisting.includes(t));
      const syncedTests = [...validExisting, ...newDiscovered];

      updatedSequence.push({
        ...secObj,
        tests: syncedTests
      });
    }
  });

  // 2. Append newly discovered sections that weren't in existing sequence
  Object.keys(scannedSectionsMap).forEach(secName => {
    if (!processedSections.has(secName)) {
      updatedSequence.push({
        id: `section-${secName.replace(/[\/]/g, '-')}`,
        name: secName,
        type: 'folder',
        order: updatedSequence.length + 1,
        tests: scannedSectionsMap[secName]
      });
    }
  });

  const finalConfig = { sequence: updatedSequence };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(finalConfig, null, 2));
  } catch (err) {}

  return finalConfig;
}

// ── API Routes ──────────────────────────────────────────────────────────────────

// GET /api/tests - Returns tree view and mapped sequence
app.get('/api/tests', (req, res) => {
  const allTests = scanTestFiles(TESTS_DIR);
  const config = getExecutionConfig();
  res.json({ tests: allTests, config });
});

// GET /api/config - Returns execution order sequence
app.get('/api/config', (req, res) => {
  res.json(getExecutionConfig());
});

// POST /api/config - Updates execution order sequence
app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    sendSSE('config-updated', newConfig);
    res.json({ success: true, message: 'Configuration saved successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Strip ANSI escape codes
function stripAnsi(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nary=><]/g, '');
}

// POST /api/run - Launches test execution
app.post('/api/run', (req, res) => {
  if (activeProcess) {
    return res.status(400).json({ success: false, message: 'A test run is already in progress!' });
  }

  const { tests, browser = 'chromium', headed = false, label = 'Custom Run' } = req.body;

  let targetTests = [];
  if (Array.isArray(tests) && tests.length > 0) {
    targetTests = tests;
  } else {
    // Default to full sequence order
    const config = getExecutionConfig();
    (config.sequence || []).forEach(sec => {
      if (Array.isArray(sec.tests)) {
        targetTests = targetTests.concat(sec.tests);
      }
    });
  }

  if (targetTests.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid test files selected for execution.' });
  }

  // Create timestamped report directory
  const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
  const reportFolderName = `report_${timestamp}`;
  const reportDirPath = path.join(REPORTS_DIR, reportFolderName);
  fs.mkdirSync(reportDirPath, { recursive: true });

  const jsonReportPath = path.join(reportDirPath, 'report.json');

  // Reset execution state
  currentExecutionState = {
    status: 'running',
    startTime: Date.now(),
    durationMs: 0,
    browser,
    headed,
    label,
    totalTests: targetTests.length,
    completedTests: 0,
    passedCount: 0,
    failedCount: 0,
    currentTest: targetTests[0],
    reportPath: `/reports/${reportFolderName}/index.html`,
    reportFolderName,
    reportDirPath,
    jsonReportPath,
    logs: [`🚀 Started execution of ${targetTests.length} test files...`]
  };

  sendSSE('state', currentExecutionState);

  // Format test paths cleanly for Playwright CLI
  const testArgs = targetTests.map(t => t.replace(/\\/g, '/'));

  // Build CLI args
  const args = ['playwright', 'test', ...testArgs, `--project=${browser}`];
  if (headed) {
    args.push('--headed');
  }
  args.push(`--reporter=json,html`);

  const spawnEnv = {
    ...process.env,
    PLAYWRIGHT_HTML_REPORT_DIR: reportDirPath,
    PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReportPath,
    HEADLESS: headed ? 'false' : 'true'
  };

  console.log(`[Dashboard] Running command: npx ${args.join(' ')}`);

  activeProcess = spawn('npx.cmd', args, {
    cwd: WORKSPACE_DIR,
    env: spawnEnv,
    shell: true
  });

  const passedSpecSet = new Set();
  const failedSpecSet = new Set();

  activeProcess.stdout.on('data', (data) => {
    const rawText = data.toString();
    const text = stripAnsi(rawText);
    if (!text.trim()) return;

    currentExecutionState.logs.push(text);

    // 1. Detect Playwright progress tracker e.g. [1/2] or [2/2]
    const progressMatch = text.match(/\[(\d+)\/(\d+)\]/);
    if (progressMatch) {
      const currentIdx = parseInt(progressMatch[1], 10);
      const totalNum = parseInt(progressMatch[2], 10);
      currentExecutionState.totalTests = totalNum;
      currentExecutionState.completedTests = Math.max(currentExecutionState.completedTests, currentIdx - 1);
    }

    // 2. Detect running spec file name
    const specFileMatch = text.match(/(tests[\\\/][^\n:]+?\.spec\.ts)/i);
    if (specFileMatch) {
      const specPath = specFileMatch[1].replace(/\\/g, '/');
      currentExecutionState.currentTest = specPath;

      if (text.includes('✓') || text.includes('passed') || text.includes('completed successfully')) {
        passedSpecSet.add(specPath);
        failedSpecSet.delete(specPath);
      } else if (text.includes('✘') || text.includes('failed') || text.includes('Error:')) {
        failedSpecSet.add(specPath);
        passedSpecSet.delete(specPath);
      }

      currentExecutionState.passedCount = passedSpecSet.size;
      currentExecutionState.failedCount = failedSpecSet.size;
      currentExecutionState.completedTests = Math.min(
        currentExecutionState.totalTests,
        Math.max(currentExecutionState.completedTests, passedSpecSet.size + failedSpecSet.size)
      );
    }

    sendSSE('log', text);
    sendSSE('state', currentExecutionState);
  });

  activeProcess.stderr.on('data', (data) => {
    const rawText = data.toString();
    const text = stripAnsi(rawText);
    if (!text.trim()) return;

    currentExecutionState.logs.push(text);
    sendSSE('log', text);
    sendSSE('state', currentExecutionState);
  });

  activeProcess.on('close', (code) => {
    activeProcess = null;
    currentExecutionState.status = code === 0 ? 'completed' : 'completed_with_failures';
    currentExecutionState.durationMs = Date.now() - currentExecutionState.startTime;

    // Copy generated playwright-report HTML assets into our timestamped report folder
    const pwReportDir = path.join(WORKSPACE_DIR, 'playwright-report');
    if (fs.existsSync(pwReportDir)) {
      try {
        fs.cpSync(pwReportDir, reportDirPath, { recursive: true });
      } catch (err) {
        console.error('Error copying Playwright HTML report assets:', err);
      }
    }

    // Parse JSON report summary if generated
    if (fs.existsSync(jsonReportPath)) {
      try {
        const jsonContent = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
        const stats = jsonContent.stats || {};
        const passed = (stats.expected || 0) + (stats.flaky || 0);
        const failed = stats.unexpected || 0;
        const total = (stats.total !== undefined) ? stats.total : (passed + failed);

        currentExecutionState.totalTests = total || targetTests.length;
        currentExecutionState.passedCount = passed;
        currentExecutionState.failedCount = failed;
        currentExecutionState.completedTests = currentExecutionState.totalTests;
      } catch (e) {
        console.error('Error parsing Playwright JSON report:', e);
      }
    } else {
      currentExecutionState.completedTests = currentExecutionState.totalTests;
      if (code === 0) {
        currentExecutionState.passedCount = currentExecutionState.totalTests;
        currentExecutionState.failedCount = 0;
      } else {
        currentExecutionState.passedCount = Math.max(0, currentExecutionState.totalTests - 1);
        currentExecutionState.failedCount = 1;
      }
    }

    // Save summary meta in report directory
    const summaryMeta = {
      label,
      timestamp,
      reportFolderName,
      reportPath: `/reports/${reportFolderName}/index.html`,
      browser,
      headed,
      status: currentExecutionState.status,
      durationMs: currentExecutionState.durationMs,
      totalTests: currentExecutionState.totalTests,
      passedCount: currentExecutionState.passedCount,
      failedCount: currentExecutionState.failedCount,
      targetTests
    };
    fs.writeFileSync(path.join(reportDirPath, 'summary-meta.json'), JSON.stringify(summaryMeta, null, 2));

    currentExecutionState.logs.push(`🏁 Test execution finished with code ${code}. Report generated in /reports/${reportFolderName}/index.html`);
    sendSSE('state', currentExecutionState);
  });

  res.json({ success: true, message: 'Execution started!', reportFolderName });
});

// POST /api/stop - Stops active test execution
app.post('/api/stop', (req, res) => {
  if (activeProcess) {
    try {
      activeProcess.kill('SIGTERM');
    } catch (e) {}
    activeProcess = null;
    currentExecutionState.status = 'stopped';
    currentExecutionState.logs.push('🛑 Execution stopped by user.');
    sendSSE('state', currentExecutionState);
    return res.json({ success: true, message: 'Test execution stopped.' });
  }
  res.json({ success: false, message: 'No active execution to stop.' });
});

// GET /api/reports - Lists all timestamped reports
app.get('/api/reports', (req, res) => {
  if (!fs.existsSync(REPORTS_DIR)) {
    return res.json({ reports: [] });
  }

  const dirs = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
  const reportsList = [];

  for (const dir of dirs) {
    if (dir.isDirectory() && dir.name.startsWith('report_')) {
      const summaryFile = path.join(REPORTS_DIR, dir.name, 'summary-meta.json');
      let meta = {
        reportFolderName: dir.name,
        reportPath: `/reports/${dir.name}/index.html`,
        timestamp: dir.name.replace('report_', ''),
        totalTests: 0,
        passedCount: 0,
        failedCount: 0,
        durationMs: 0
      };

      if (fs.existsSync(summaryFile)) {
        try {
          meta = { ...meta, ...JSON.parse(fs.readFileSync(summaryFile, 'utf8')) };
        } catch (e) {}
      }
      reportsList.push(meta);
    }
  }

  // Sort descending by timestamp
  reportsList.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  res.json({ reports: reportsList });
});

// POST /api/reports/delete - Deletes single or multiple report folders
app.post('/api/reports/delete', (req, res) => {
  const { folderNames } = req.body;
  if (!Array.isArray(folderNames) || folderNames.length === 0) {
    return res.status(400).json({ success: false, message: 'No report folders specified for deletion.' });
  }

  let deletedCount = 0;
  folderNames.forEach(folderName => {
    const safeName = path.basename(folderName);
    if (safeName.startsWith('report_')) {
      const targetDir = path.join(REPORTS_DIR, safeName);
      if (fs.existsSync(targetDir)) {
        try {
          fs.rmSync(targetDir, { recursive: true, force: true });
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete report ${safeName}:`, err);
        }
      }
    }
  });

  res.json({ success: true, message: `Successfully deleted ${deletedCount} report folder(s).`, deletedCount });
});

// Start Server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 AIV Playwright Test Automation Dashboard Running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`===============================================================\n`);
});
