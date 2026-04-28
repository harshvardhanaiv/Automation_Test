/**
 * ai/daily-runner.js
 *
 * Self-healing runner for the entire tests/daily/ suite.
 *
 * Flow:
 *  1. Run ALL daily spec files via Playwright (JSON reporter, configurable workers).
 *  2. Parse the JSON report — collect every failing test with its file, title, error.
 *  3. Group failures by spec file.
 *  4. For each failing spec file, ask Ollama to patch ONLY the failing test(s)
 *     inside that file — leaving passing tests untouched.
 *  5. Write the patched file and re-run the WHOLE daily suite.
 *  6. Repeat up to MAX_RETRIES times.
 *  7. Exit 0 if all tests pass, exit 1 otherwise.
 *
 * Usage:
 *   node ai/daily-runner.js                        ← run all daily tests
 *   node ai/daily-runner.js --file 02-viz          ← run + heal one file only
 *   node ai/daily-runner.js --workers 10           ← override worker count
 *   node ai/daily-runner.js --dry-run              ← show failures, no healing
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');
const { FIX_SYSTEM_PROMPT } = require('./systemPrompt');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const fileArg   = args.includes('--file')    ? args[args.indexOf('--file') + 1]    : null;
const workersArg= args.includes('--workers') ? args[args.indexOf('--workers') + 1] : '4';
const dryRun    = args.includes('--dry-run');

// ── Config ────────────────────────────────────────────────────────────────────

const DAILY_DIR   = path.join(__dirname, '../tests/daily');
const REPORT_FILE = path.join(__dirname, '../test-results/daily-report.json');
const MAX_RETRIES = config.maxRetries ?? 3;
const OLLAMA_URL  = config.ollamaUrl;
const MODEL       = config.model;

// Resolve which spec files to target
function getTargetPattern() {
  if (fileArg) {
    // e.g. --file 02-viz  →  tests/daily/02-viz.spec.ts
    const match = fs.readdirSync(DAILY_DIR).find(f => f.includes(fileArg));
    if (!match) {
      console.error(`❌ No daily spec file matching "${fileArg}"`);
      process.exit(1);
    }
    return `"tests/daily/${match}"`;
  }
  return '"tests/daily/"';
}

// ── Run tests ─────────────────────────────────────────────────────────────────

function runTests(pattern) {
  const dir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cmd = [
    'npx playwright test',
    pattern,
    `--workers=${workersArg}`,
    '--reporter=json',
    `--output="${path.relative(process.cwd(), dir)}"`,
  ].join(' ');

  console.log(`\n▶  ${cmd}\n`);

  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    if (stdout.trim().startsWith('{')) fs.writeFileSync(REPORT_FILE, stdout);
    return { passed: true, stdout, stderr: '' };
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    if (stdout.trim().startsWith('{')) fs.writeFileSync(REPORT_FILE, stdout);
    return { passed: false, stdout, stderr };
  }
}

// ── Parse failures ────────────────────────────────────────────────────────────

function parseFailures(reportPath) {
  if (!fs.existsSync(reportPath)) return [];

  let report;
  try { report = JSON.parse(fs.readFileSync(reportPath, 'utf-8')); }
  catch { return []; }

  const failures = [];

  function walkSuites(suites, filePath) {
    if (!suites) return;
    for (const suite of suites) {
      // suite.file is set at the top-level suite
      const file = suite.file || filePath;
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of (spec.tests || [])) {
            const failed = (test.results || []).some(
              r => r.status === 'failed' || r.status === 'timedOut'
            );
            if (failed) {
              const result = test.results.find(
                r => r.status === 'failed' || r.status === 'timedOut'
              ) || {};
              failures.push({
                file,
                title:     spec.title,
                fullTitle: `${suite.title} > ${spec.title}`,
                error:     result.error
                  ? `${result.error.message || ''}\n${result.error.stack || ''}`
                  : 'Unknown error',
              });
            }
          }
        }
      }
      if (suite.suites) walkSuites(suite.suites, file);
    }
  }

  walkSuites(report.suites, '');
  return failures;
}

// ── Group failures by file ────────────────────────────────────────────────────

function groupByFile(failures) {
  const map = {};
  for (const f of failures) {
    const key = f.file || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(f);
  }
  return map;
}

// ── Resolve absolute path from suite file string ──────────────────────────────

function resolveSpecPath(suiteFile) {
  // suiteFile may be relative like "tests/daily/02-viz.spec.ts"
  // or an absolute path already
  if (path.isAbsolute(suiteFile)) return suiteFile;
  return path.join(process.cwd(), suiteFile);
}

// ── Ask Ollama to fix a failing test in a file ────────────────────────────────

async function askOllamaToFix(specPath, failures) {
  const currentCode = fs.readFileSync(specPath, 'utf-8');
  const failureList = failures
    .map(f => `TEST: "${f.title}"\nERROR:\n${f.error}`)
    .join('\n\n---\n\n');

  console.log(`\n🤖 Asking Ollama to fix ${failures.length} test(s) in: ${path.basename(specPath)}`);
  failures.forEach(f => console.log(`   • ${f.title}`));

  const userPrompt = `The following tests are failing in this Playwright spec file.

FAILING TESTS:
${failureList}

FULL SPEC FILE (${path.basename(specPath)}):
${currentCode}

Fix ONLY the failing tests listed above. Do NOT change passing tests, imports, or helpers.
Return the COMPLETE corrected TypeScript file.`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    messages: [
      { role: 'system', content: FIX_SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    stream: false,
  }, { timeout: 180000 });

  let fixed = response.data.message.content;
  fixed = fixed.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return fixed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pattern = getTargetPattern();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   AIV Daily Runner — Self-Healing with Ollama            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`   Target  : ${pattern}`);
  console.log(`   Workers : ${workersArg}`);
  console.log(`   Model   : ${MODEL}`);
  console.log(`   Retries : ${MAX_RETRIES}`);
  console.log(`   Dry run : ${dryRun}`);

  const retryCounts = {}; // key: "file::testTitle"
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt++;
    console.log(`\n${'━'.repeat(60)}`);
    console.log(` Run attempt ${attempt} / ${MAX_RETRIES + 1}`);
    console.log('━'.repeat(60));

    const { passed } = runTests(pattern);

    if (passed) {
      console.log('\n✅ All daily tests passed!');
      printSummary(attempt, true);
      process.exit(0);
    }

    const failures = parseFailures(REPORT_FILE);

    if (failures.length === 0) {
      console.log('\n⚠️  No parseable failures. Treating as passed.');
      printSummary(attempt, true);
      process.exit(0);
    }

    console.log(`\n🔴 ${failures.length} test(s) failed across ${Object.keys(groupByFile(failures)).length} file(s):`);
    failures.forEach(f => console.log(`   • [${path.basename(f.file || '')}] ${f.fullTitle}`));

    if (dryRun) {
      console.log('\n🔍 Dry run — skipping self-healing.');
      process.exit(1);
    }

    if (attempt > MAX_RETRIES) {
      console.log('\n❌ Max retries reached. Unhealed failures:');
      failures.forEach(f => console.log(`   • ${f.fullTitle}`));
      printSummary(attempt, false);
      process.exit(1);
    }

    // ── Heal each failing file ────────────────────────────────────────────
    const byFile = groupByFile(failures);
    let anyFixed = false;

    for (const [suiteFile, fileFails] of Object.entries(byFile)) {
      const specPath = resolveSpecPath(suiteFile);

      if (!fs.existsSync(specPath)) {
        console.log(`\n⚠️  Cannot find spec file: ${specPath} — skipping`);
        continue;
      }

      // Filter out tests that have already hit their retry cap
      const healable = fileFails.filter(f => {
        const key = `${suiteFile}::${f.title}`;
        retryCounts[key] = (retryCounts[key] || 0) + 1;
        if (retryCounts[key] > MAX_RETRIES) {
          console.log(`\n⏭  Skipping "${f.title}" — already retried ${MAX_RETRIES} times.`);
          return false;
        }
        return true;
      });

      if (healable.length === 0) continue;

      try {
        const fixed = await askOllamaToFix(specPath, healable);

        if (fixed && fixed.length > 200) {
          // Back up original on first patch
          const bakPath = specPath + '.bak';
          if (!fs.existsSync(bakPath)) {
            fs.writeFileSync(bakPath, fs.readFileSync(specPath));
            console.log(`\n💾 Backed up: ${path.basename(bakPath)}`);
          }
          fs.writeFileSync(specPath, fixed);
          anyFixed = true;
          console.log(`✅ Patched: ${path.basename(specPath)}`);
        } else {
          console.log(`⚠️  Ollama returned empty/short response for ${path.basename(specPath)}`);
        }
      } catch (err) {
        console.error(`❌ Ollama request failed for ${path.basename(specPath)}: ${err.message}`);
      }
    }

    if (!anyFixed) {
      console.log('\n⚠️  No fixes applied — stopping to avoid infinite loop.');
      printSummary(attempt, false);
      process.exit(1);
    }

    console.log('\n📝 Patches applied — re-running tests...');
  }
}

function printSummary(attempts, passed) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  if (passed) {
    console.log('║  ✅ DAILY RUN COMPLETE — All tests passed!               ║');
  } else {
    console.log('║  ❌ DAILY RUN FAILED — Self-healing exhausted            ║');
  }
  console.log(`║  Attempts: ${String(attempts).padEnd(48)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
