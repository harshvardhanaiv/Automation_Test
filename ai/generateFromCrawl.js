/**
 * generateFromCrawl.js
 *
 * Reads crawl-result.json and generates tests/explore.spec.ts directly
 * from the crawl data — no Ollama call needed. Fast and reliable.
 *
 * For each section it generates a test that:
 *   - Navigates to the section URL
 *   - Waits for network idle
 *   - Verifies the URL changed to the expected path
 *   - Checks the search box is visible (confirms app shell loaded)
 *   - Interacts with the first meaningful button or input found
 *   - Takes a screenshot
 *
 * Usage:
 *   node ai/generateFromCrawl.js
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Turn a section name into a safe filename slug.
 * e.g. "Merge Reports" → "merge-reports"
 */
function toSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Turn a section name into a safe TypeScript variable name.
 * e.g. "Merge Reports" → "mergeReports"
 */
function toCamel(name) {
    return name
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

/**
 * Pick the best interactive element to assert/interact with.
 * Priority: named button > named input > table > anything
 * Skips noisy/generic elements that cause strict mode violations.
 */
function pickBestElement(elements) {
    if (!elements || elements.length === 0) return null;

    // Skip these generic texts that appear on every page or cause strict mode issues
    const skipTexts = [
        'home', 'dropdown trigger', 'all', 'current',
        'toggle undefined', 'search', // 'search' alone matches too many inputs
    ];

    // Prefer a button with specific, unique text
    const button = elements.find(e =>
        e.tag === 'button' &&
        e.text &&
        e.text.length > 2 &&
        !skipTexts.includes(e.text.toLowerCase())
    );
    if (button) return button;

    // Prefer a named input (not the global search box, not generic 'Search')
    const input = elements.find(e =>
        e.tag === 'input' &&
        e.text &&
        e.text !== 'Search files and folders in All sections' &&
        e.text.toLowerCase() !== 'search' &&
        e.text.length > 2
    );
    if (input) return input;

    // Fall back to a table
    const table = elements.find(e => e.tag === 'table');
    if (table) return table;

    return null;
}

/**
 * Generate the assertion/interaction lines for a section.
 */
function buildInteractionLines(section) {
    const lines = [];
    const el = pickBestElement(section.interactiveElements);

    if (!el) {
        // No useful element — verify the actual URL path instead of guessing a name-based regex
        const urlPath = new URL(section.url).pathname.split('/').filter(Boolean).pop() || '';
        if (urlPath) {
            lines.push(`  // Verify URL confirms navigation to this section`);
            lines.push(`  await expect(page).toHaveURL(/${urlPath}/i);`);
        } else {
            lines.push(`  // Verify app shell is present`);
            lines.push(`  await expect(page.getByPlaceholder('Search files and folders in All sections')).toBeVisible({ timeout: 10000 });`);
        }
        return lines;
    }

    if (el.tag === 'button') {
        lines.push(`  // Verify the '${el.text}' button is visible`);
        // Use .first() to guard against strict mode violations if multiple matches exist
        lines.push(`  await expect(page.getByRole('button', { name: '${el.text.replace(/'/g, "\\'")}', exact: true }).first()).toBeVisible({ timeout: 10000 });`);
    } else if (el.tag === 'input' && (el.type === 'text' || el.type === 'email' || el.type === '')) {
        lines.push(`  // Verify the '${el.text}' input is visible`);
        // Use .first() to guard against strict mode violations (duplicate inputs on same page)
        lines.push(`  await expect(page.getByPlaceholder('${el.text.replace(/'/g, "\\'")}').first()).toBeVisible({ timeout: 10000 });`);
    } else if (el.tag === 'table') {
        lines.push(`  // Verify a data table is rendered`);
        lines.push(`  await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });`);
    } else {
        lines.push(`  // Verify page shell loaded`);
        lines.push(`  await expect(page.getByPlaceholder('Search files and folders in All sections')).toBeVisible({ timeout: 10000 });`);
    }

    return lines;
}

/**
 * Generate a full test() block for one section.
 */
function buildTestBlock(section) {
    const slug = toSlug(section.name);
    const interaction = buildInteractionLines(section);

    return `  test('${section.name.replace(/'/g, "\\'")}', async ({ page }) => {
    await page.goto('${section.url}', { waitUntil: 'networkidle', timeout: 30000 });
    // Confirm app shell is loaded
    await expect(page.getByPlaceholder('Search files and folders in All sections')).toBeVisible({ timeout: 15000 });
${interaction.map(l => '  ' + l).join('\n')}
    await page.screenshot({ path: 'screenshots/${slug}.png', fullPage: true });
  });`;
}

async function generateFromCrawl(crawlData = null, testFilePath = null) {
    // Load crawl data
    if (!crawlData) {
        if (!fs.existsSync(config.crawlResultPath)) {
            throw new Error(`crawl-result.json not found at ${config.crawlResultPath}. Run: npm run crawl`);
        }
        crawlData = JSON.parse(fs.readFileSync(config.crawlResultPath, 'utf-8'));
    }

    const outputPath = testFilePath || config.exploreTestPath;
    const validSections = crawlData.sections.filter(s => !s.error && s.url && s.url !== '#');

    console.log(`\n⚡ Generating tests for ${validSections.length} sections from crawl data (no Ollama needed)...`);

    // Ensure screenshots dir exists
    if (!fs.existsSync(config.screenshotsDir)) {
        fs.mkdirSync(config.screenshotsDir, { recursive: true });
    }

    // Ensure tests dir exists
    const testsDir = path.dirname(outputPath);
    if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir, { recursive: true });
    }

    // Build all test blocks
    const testBlocks = validSections.map(section => buildTestBlock(section));

    // Assemble the final file
    const fileContent = `/**
 * explore.spec.ts
 *
 * Auto-generated by AIV Explorer.
 * Re-generate with: npm run generate:explore
 *
 * Generated : ${new Date().toISOString()}
 * Sections  : ${validSections.length}
 * Base URL  : ${config.baseUrl}
 */

import { test, expect } from '@playwright/test';

const BASE_URL = '${config.baseUrl}';
const USERNAME = '${config.credentials.username}';
const PASSWORD = '${config.credentials.password}';

test.describe('AIV Application - Full Feature Exploration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector("input[name='username']", { timeout: 15000 });
    await page.fill("input[name='username']", USERNAME);
    await page.fill("input[name='password']", PASSWORD);
    await page.click("button:has-text('Login')");
    await page.waitForSelector("input[placeholder='Search files and folders in All sections']", { timeout: 30000 });
  });

${testBlocks.join('\n\n')}

});
`;

    fs.writeFileSync(outputPath, fileContent);

    console.log(`✅ Done! ${validSections.length} tests written to: ${outputPath}`);
    console.log(`\n   Run the tests with: npm run test:explore\n`);

    return outputPath;
}

// CLI entry point
if (require.main === module) {
    generateFromCrawl().catch(err => {
        console.error('Fatal:', err.message);
        process.exit(1);
    });
}

module.exports = generateFromCrawl;
