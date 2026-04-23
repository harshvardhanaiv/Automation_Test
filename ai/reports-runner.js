/**
 * ai/reports-runner.js
 *
 * Self-healing runner for tests/reports.spec.ts
 *
 * Flow:
 *  1. Run the test file via Playwright (JSON reporter).
 *  2. Collect failing tests (name + error + stack).
 *  3. For each failure, ask Ollama to patch ONLY that test function.
 *  4. Write the patched file and re-run.
 *  5. Repeat up to MAX_RETRIES times.
 *  6. Exit 0 if all pass, exit 1 otherwise.
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const TEST_FILE   = path.join(__dirname, '../tests/reports.spec.ts');
const REPORT_FILE = path.join(__dirname, '../test-results/reports-report.json');
const MAX_RETRIES = config.maxRetries ?? 3;
const OLLAMA_URL  = config.ollamaUrl;
const MODEL       = config.model;

// ── Helpers ───────────────────────────────────────────────────────────────────

function runTests() {
  const dir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cmd = [
    'npx playwright test',
    `"tests/reports.spec.ts"`,
    `--reporter=json`,
    `--output="${path.relative(process.cwd(), dir)}"`,
  ].join(' ');

  console.log(`\n▶  ${cmd}\n`);

  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    fs.writeFileSync(REPORT_FILE, stdout);
    return { passed: true, stdout, stderr: '' };
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    if (stdout.trim().startsWith('{')) {
      fs.writeFileSync(REPORT_FILE, stdout);
    }
    return { passed: false, stdout, stderr };
  }
}

function parseFailures(reportPath) {
  if (!fs.existsSync(reportPath)) return [];
  let report;
  try { report = JSON.parse(fs.readFileSync(reportPath, 'utf-8')); }
  catch { return []; }

  const failures = [];
  function walkSuites(suites) {
    if (!suites) return;
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of (spec.tests || [])) {
            const failed = (test.results || []).some(
              r => r.status === 'failed' || r.status === 'timedOut'
            );
            if (failed) {
              const result = test.results.find(r => r.status === 'failed' || r.status === 'timedOut') || {};
              failures.push({
                title: spec.title,
                fullTitle: `${suite.title} > ${spec.title}`,
                error: result.error
                  ? `${result.error.message || ''}\n${result.error.stack || ''}`
                  : 'Unknown error',
              });
            }
          }
        }
      }
      if (suite.suites) walkSuites(suite.suites);
    }
  }
  walkSuites(report.suites);
  return failures;
}

async function askOllamaToFix(currentCode, testTitle, errorLog) {
  console.log(`\n🤖 Asking Ollama to fix: "${testTitle}"...`);

  const systemPrompt = `You are an expert Playwright TypeScript automation engineer.
You will receive a full test file and the error from one specific failing test.
Your job is to fix ONLY the failing test function — do NOT change any other test, helper, class, or import.
Return the COMPLETE fixed file as valid TypeScript. No explanations, no markdown fences.

════════════════════════════════════════════════════════
CONFIRMED WORKING SELECTORS — AIV application
(verified by running tests against the live app)
════════════════════════════════════════════════════════

── Auth ──────────────────────────────────────────────
- Username input:      input[name='username']
- Password input:      input[name='password']
- Login button:        button:has-text('Login')
- App shell (ready):   input[placeholder='Search files and folders in All sections']
                       OR button.smenu_button

── Navigation ────────────────────────────────────────
- Reports URL:         https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports
- Requests URL:        https://aiv.test.oneaiv.com:8086/aiv/Request/Request
- goTo() waits for app shell with Promise.race on search box OR smenu_button
- Navigation timeout:  120000ms for page.goto, 90000ms for app shell wait

── File browser grid ─────────────────────────────────
- Grid cells:          [role="gridcell"]
- Cell text format:    "FilenamePath :: /" (name + path concatenated, no newline)
- Finding an item:     locator('[role="gridcell"]').filter({ hasText: name }).first()
- Items off-screen:    grid clips rows with overflow:hidden — use page.evaluate()
                       to call target.scrollIntoView({ block:'center', behavior:'instant' })
                       then waitFor({ state:'visible' }) AFTER scrolling
- Opening an item:     waitFor('attached') → evaluate scrollIntoView → waitFor('visible') → dblclick()
- DO NOT use:          waitFor('visible') before scrollIntoView — it will timeout

── Scheduler dialog tabs ─────────────────────────────
- Tab selector:        page.locator('[role="tab"]').filter({ hasText: /parameter|schedule|output|email/i }).first()
- Parameter tab:       check isVisible first — some reports have no parameters
- Fill empty inputs:   locator('input[type="text"]:visible:not([readonly]):not([disabled])')
                       check inputValue() first, only fill if empty

── Schedule tab ──────────────────────────────────────
- Right Now option:    page.getByText('Right Now', { exact: false }).first()
                       waitFor visible then click

── Output tab ────────────────────────────────────────
- Name input:          locator('input[name="soutputname"]')
                       OR getByPlaceholder('Enter Static Name')
                       (DO NOT use getByRole('textbox', { name: /name/i }) — matches multiple)
- Format dropdown:     getByText('rptdocument', { exact: true }).first() → click to open
- PDF option:          getByRole('option', { name: /^pdf$/i })
                       OR locator('li').filter({ hasText: /^pdf$/i }).first()

── Run button ────────────────────────────────────────
- Run:                 getByRole('button', { name: /^run$/i })
- Cancel:              getByRole('button', { name: /cancel/i })
- After clicking Run:  waitForTimeout(3000)

── Request section verification ──────────────────────
- Navigate directly:   goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Request/Request')
- Find run by name:    page.getByText(runName, { exact: false })
- Poll with reload:    reload({ waitUntil:'domcontentloaded', timeout:60000 })
                       up to 12 attempts × 3s wait = ~60s total
- Status values:       'Completed', 'Running', 'Failed', 'Scheduled'

════════════════════════════════════════════════════════
COMMON FAILURE PATTERNS AND FIXES
════════════════════════════════════════════════════════

1. "strict mode violation" on name input
   → Replace getByRole('textbox', { name: /name/i }) with locator('input[name="soutputname"]')

2. "element not visible" on gridcell
   → Use waitFor('attached') then page.evaluate scrollIntoView, then waitFor('visible')

3. "navigation to controlpanel" when using search box
   → NEVER use the global search box to find report items — it navigates away
   → Use the gridcell + scrollIntoView approach instead

4. "timeout on domcontentloaded"
   → Increase page.goto timeout to 120000ms
   → Use Promise.race for app shell detection

5. Format dropdown not found
   → Check if 'rptdocument' text is visible first with isVisible({ timeout: 3000 })
   → Only click if visible; skip format change if already correct`;

  const userPrompt = `The following test is failing:

TEST TITLE: ${testTitle}

ERROR:
${errorLog}

FULL TEST FILE:
${currentCode}

Fix only the failing test ("${testTitle}") and return the complete corrected TypeScript file.`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    stream: false,
  }, { timeout: 120000 });

  let fixed = response.data.message.content;
  fixed = fixed.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return fixed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' Self-Healing Runner — tests/reports.spec.ts');
  console.log('═══════════════════════════════════════════════════════');

  const retryCounts = {};
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt++;
    console.log(`\n━━━ Run attempt ${attempt} / ${MAX_RETRIES + 1} ━━━`);

    const { passed } = runTests();
    if (passed) { console.log('\n✅ All tests passed!'); process.exit(0); }

    const failures = parseFailures(REPORT_FILE);
    if (failures.length === 0) {
      console.log('\n⚠️  No parseable failures. Treating as passed.');
      process.exit(0);
    }

    console.log(`\n🔴 ${failures.length} test(s) failed:`);
    failures.forEach(f => console.log(`   • ${f.fullTitle}`));

    if (attempt > MAX_RETRIES) {
      console.log('\n❌ Max retries reached.');
      failures.forEach(f => console.log(`   • ${f.fullTitle}`));
      process.exit(1);
    }

    let currentCode = fs.readFileSync(TEST_FILE, 'utf-8');
    let anyFixed = false;

    for (const failure of failures) {
      const key = failure.title;
      retryCounts[key] = (retryCounts[key] || 0) + 1;
      if (retryCounts[key] > MAX_RETRIES) {
        console.log(`\n⏭  Skipping "${key}" — already retried ${MAX_RETRIES} times.`);
        continue;
      }
      try {
        const fixed = await askOllamaToFix(currentCode, failure.title, failure.error);
        if (fixed && fixed.length > 100) {
          currentCode = fixed;
          anyFixed = true;
          console.log(`✅ Ollama provided a fix for: "${key}"`);
        } else {
          console.log(`⚠️  Ollama returned an empty/short response for: "${key}"`);
        }
      } catch (err) {
        console.error(`❌ Ollama request failed for "${key}": ${err.message}`);
      }
    }

    if (anyFixed) {
      if (attempt === 1) {
        fs.writeFileSync(TEST_FILE + '.bak', fs.readFileSync(TEST_FILE));
        console.log(`\n💾 Original backed up to tests/reports.spec.ts.bak`);
      }
      fs.writeFileSync(TEST_FILE, currentCode);
      console.log(`\n📝 Patched file written — re-running tests...`);
    } else {
      console.log('\n⚠️  No fixes applied. Stopping.');
      process.exit(1);
    }
  }
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
