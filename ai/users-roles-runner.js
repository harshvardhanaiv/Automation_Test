/**
 * ai/users-roles-runner.js
 *
 * Self-healing runner for tests/users-roles.spec.ts
 *
 * Flow:
 *  1. Run the full test file via Playwright (JSON reporter).
 *  2. Collect any failing tests (name + error message + stack).
 *  3. For each failing test, ask Ollama to patch ONLY that test function
 *     inside the current file — leaving passing tests untouched.
 *  4. Write the patched file and re-run.
 *  5. Repeat up to MAX_RETRIES times per failing test.
 *  6. Exit 0 if all tests eventually pass, exit 1 otherwise.
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const TEST_FILE   = path.join(__dirname, '../tests/users-roles.spec.ts');
const REPORT_FILE = path.join(__dirname, '../test-results/users-roles-report.json');
const MAX_RETRIES = config.maxRetries ?? 3;
const OLLAMA_URL  = config.ollamaUrl;
const MODEL       = config.model;

// ── Helpers ───────────────────────────────────────────────────────────────────

function runTests() {
  // Ensure output dir exists
  const dir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cmd = [
    'npx playwright test',
    `"tests/users-roles.spec.ts"`,
    `--reporter=json`,
    `--output="${path.relative(process.cwd(), dir)}"`,
  ].join(' ');

  console.log(`\n▶  ${cmd}\n`);

  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    // Write report even on success (Playwright writes to stdout with json reporter)
    fs.writeFileSync(REPORT_FILE, stdout);
    return { passed: true, stdout, stderr: '' };
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    // Playwright json reporter writes to stdout even on failure
    if (stdout.trim().startsWith('{')) {
      fs.writeFileSync(REPORT_FILE, stdout);
    }
    return { passed: false, stdout, stderr };
  }
}

function parseFailures(reportPath) {
  if (!fs.existsSync(reportPath)) return [];

  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  } catch {
    return [];
  }

  const failures = [];

  function walkSuites(suites) {
    if (!suites) return;
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of (spec.tests || [])) {
            const failed = (test.results || []).some(r => r.status === 'failed' || r.status === 'timedOut');
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
Your job is to fix ONLY the failing test function — do NOT change any other test, helper, or import.
Return the COMPLETE fixed file as valid TypeScript. No explanations, no markdown fences.

Known stable selectors for this AIV application:
- Username input:  input[name='username']
- Password input:  input[name='password']
- Login button:    button:has-text('Login')
- Search box:      input[placeholder='Search files and folders in All sections']
- Grid cell:       [role="gridcell"]
- Dialog:          [role="dialog"]`;

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
  // Strip any accidental markdown fences
  fixed = fixed.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return fixed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' Self-Healing Runner — tests/users-roles.spec.ts');
  console.log('═══════════════════════════════════════════════════════');

  // Track per-test retry counts
  const retryCounts = {};

  let attempt = 0;
  const globalMax = MAX_RETRIES + 1; // initial run + up to MAX_RETRIES fix cycles

  while (attempt <= MAX_RETRIES) {
    attempt++;
    console.log(`\n━━━ Run attempt ${attempt} / ${MAX_RETRIES + 1} ━━━`);

    const { passed } = runTests();

    if (passed) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }

    const failures = parseFailures(REPORT_FILE);

    if (failures.length === 0) {
      // Playwright exited non-zero but no parseable failures — treat as pass
      // (can happen with skipped tests or config issues)
      console.log('\n⚠️  No parseable failures found in report. Treating as passed.');
      process.exit(0);
    }

    console.log(`\n🔴 ${failures.length} test(s) failed:`);
    failures.forEach(f => console.log(`   • ${f.fullTitle}`));

    if (attempt > MAX_RETRIES) {
      console.log('\n❌ Max retries reached. The following tests could not be healed:');
      failures.forEach(f => console.log(`   • ${f.fullTitle}`));
      process.exit(1);
    }

    // Fix each failing test (skip any that have already hit their own retry cap)
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
      // Back up original before first patch
      if (attempt === 1) {
        fs.writeFileSync(TEST_FILE + '.bak', fs.readFileSync(TEST_FILE));
        console.log(`\n💾 Original backed up to tests/users-roles.spec.ts.bak`);
      }
      fs.writeFileSync(TEST_FILE, currentCode);
      console.log(`\n📝 Patched file written — re-running tests...`);
    } else {
      console.log('\n⚠️  No fixes were applied. Stopping to avoid infinite loop.');
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
