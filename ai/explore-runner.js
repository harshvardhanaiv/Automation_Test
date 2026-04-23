/**
 * explore-runner.js
 * 
 * Full pipeline:
 *   1. Crawl the app to discover all sections  (crawl.js)
 *   2. Generate a test suite from crawl data   (generateFromCrawl.js)
 *   3. Run the generated tests via Playwright
 *   4. If tests fail, self-heal using fixTest   (fixTest.js)
 * 
 * Usage:
 *   node ai/explore-runner.js                  ← full pipeline (crawl + generate + run)
 *   node ai/explore-runner.js --skip-crawl     ← reuse existing crawl-result.json
 *   node ai/explore-runner.js --skip-generate  ← reuse existing explore.spec.ts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const crawl = require('./crawl');
const generateFromCrawl = require('./generateFromCrawl');
const fixTest = require('./fixTest');

const args = process.argv.slice(2);
const SKIP_CRAWL = args.includes('--skip-crawl') || args.includes('--skip-generate');
const SKIP_GENERATE = args.includes('--skip-generate');

async function exploreRunner() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   AIV Explorer — Crawl → Generate → Test → Fix  ║');
    console.log('╚══════════════════════════════════════════════════╝');

    // ── Step 1: Crawl ─────────────────────────────────────────────────────────
    let crawlData;
    if (SKIP_CRAWL) {
        if (!fs.existsSync(config.crawlResultPath)) {
            console.error('❌ --skip-crawl used but crawl-result.json not found. Run without the flag first.');
            process.exit(1);
        }
        crawlData = JSON.parse(fs.readFileSync(config.crawlResultPath, 'utf-8'));
        console.log(`\n⏭️  Skipping crawl. Using existing data (${crawlData.totalSections} sections from ${crawlData.crawledAt}).`);
    } else {
        console.log('\n── Step 1/3: Crawling application ──────────────────');
        crawlData = await crawl();
    }

    // ── Step 2: Generate ──────────────────────────────────────────────────────
    if (!SKIP_GENERATE) {
        console.log('\n── Step 2/3: Generating test suite ─────────────────');
        await generateFromCrawl(crawlData, config.exploreTestPath);
    } else {
        if (!fs.existsSync(config.exploreTestPath)) {
            console.error('❌ --skip-generate used but explore.spec.ts not found. Run without the flag first.');
            process.exit(1);
        }
        console.log(`\n⏭️  Skipping generation. Using existing: ${config.exploreTestPath}`);
    }

    // ── Step 3: Run + Self-Heal ───────────────────────────────────────────────
    console.log('\n── Step 3/3: Running tests (with self-healing) ─────');

    const relativePath = path.relative(process.cwd(), config.exploreTestPath);
    let currentTry = 0;
    let passed = false;

    while (currentTry < config.maxRetries && !passed) {
        currentTry++;
        console.log(`\n🚀 Test Run #${currentTry} of ${config.maxRetries}...`);

        try {
            const command = `npx playwright test "${relativePath}" --reporter=list`;
            console.log(`   Running: ${command}\n`);

            const output = execSync(command, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });

            console.log(output);
            console.log(`\n🎉 All tests passed on run #${currentTry}!`);
            passed = true;

        } catch (error) {
            console.error(`\n🔴 Tests failed on run #${currentTry}.`);

            const stdout = error.stdout ? error.stdout.toString() : '';
            const stderr = error.stderr ? error.stderr.toString() : '';
            const fullLogs = `${stdout}\n${stderr}`;

            console.log('\n--- FAILURE LOGS ---');
            console.log(fullLogs.slice(0, 3000)); // truncate very long logs
            console.log('--------------------');

            if (currentTry < config.maxRetries) {
                console.log(`\n🩹 Self-healing attempt ${currentTry}/${config.maxRetries - 1}...`);
                const currentCode = fs.readFileSync(config.exploreTestPath, 'utf-8');
                await fixTest(fullLogs, currentCode, config.exploreTestPath);
            } else {
                console.error(`\n❌ Max retries (${config.maxRetries}) reached. Manual review needed.`);
                console.error(`   Review the test file: ${config.exploreTestPath}`);
                console.error(`   Review crawl data:    ${config.crawlResultPath}`);
            }
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════╗');
    if (passed) {
        console.log('║  ✅ EXPLORE RUN COMPLETE — All tests passed!     ║');
        console.log(`║  📄 Test file: tests/explore.spec.ts             ║`);
        console.log(`║  📸 Screenshots: screenshots/                    ║`);
        console.log('║                                                  ║');
        console.log('║  Run anytime with: npm run test:explore          ║');
    } else {
        console.log('║  ❌ EXPLORE RUN FAILED — Self-healing exhausted  ║');
        console.log('║  Check logs above and review explore.spec.ts     ║');
    }
    console.log('╚══════════════════════════════════════════════════╝\n');

    return passed;
}

// CLI entry point
if (require.main === module) {
    exploreRunner().then(passed => {
        if (!passed) process.exit(1);
    }).catch(err => {
        console.error('Fatal Error:', err);
        process.exit(1);
    });
}

module.exports = exploreRunner;
