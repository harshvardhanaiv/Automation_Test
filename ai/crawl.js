/**
 * crawl.js
 * 
 * Logs into the AIV application using Playwright, then crawls the sidebar
 * to discover all navigation sections and sub-items.
 * 
 * Output: ai/crawl-result.json
 * 
 * Usage:
 *   node ai/crawl.js
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const config = require('./config');

async function crawl() {
    console.log('\n🔍 Starting crawler...');
    console.log(`   Target: ${config.baseUrl}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        ignoreHTTPSErrors: true, // needed for self-signed cert on test server
    });
    const page = await context.newPage();

    // ── 1. Login ──────────────────────────────────────────────────────────────
    console.log('\n🔐 Logging in...');
    await page.goto(config.baseUrl, { waitUntil: 'networkidle' });

    await page.waitForSelector(config.selectors.usernameInput, { timeout: 15000 });
    await page.fill(config.selectors.usernameInput, config.credentials.username);
    await page.fill(config.selectors.passwordInput, config.credentials.password);
    await page.click(config.selectors.loginButton);

    // Wait for dashboard to confirm login success
    await page.waitForSelector(config.selectors.searchBox, { timeout: 30000 });
    console.log('✅ Login successful.');

    // ── 2. Crawl Sidebar ──────────────────────────────────────────────────────
    console.log('\n📋 Crawling sidebar navigation...');

    const navItems = [];

    // Give sidebar a moment to fully render
    await page.waitForTimeout(2000);

    // Collect all top-level sidebar links/items
    // The sidebar uses .sidebardiv — grab all direct nav entries
    const topLevelItems = await page.$$eval(
        `${config.selectors.sidebar} > ul > li, ${config.selectors.sidebar} li.nav-item, ${config.selectors.sidebar} .nav-link`,
        (els) => els.map(el => ({
            text: el.innerText?.trim().split('\n')[0] || '',
            href: el.querySelector('a')?.href || '',
            hasChildren: el.querySelector('ul') !== null || el.querySelector('.submenu') !== null,
        })).filter(item => item.text.length > 0)
    );

    // Fallback: grab all anchor tags inside the sidebar
    const allLinks = await page.$$eval(
        `${config.selectors.sidebar} a`,
        (anchors) => anchors.map(a => ({
            text: a.innerText?.trim() || a.title?.trim() || '',
            href: a.href || '',
        })).filter(a => a.text.length > 0 && a.href.length > 0)
    );

    // Deduplicate by text
    const seen = new Set();
    const dedupedLinks = [];
    for (const link of allLinks) {
        const key = link.text.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            dedupedLinks.push(link);
        }
    }

    console.log(`   Found ${dedupedLinks.length} sidebar links.`);

    // ── 3. Expand collapsible sections and collect sub-items ─────────────────
    console.log('\n🔽 Expanding collapsible sections...');

    // Click items that have expand arrows (chevrons / caret icons)
    const expandableItems = await page.$$(
        `${config.selectors.sidebar} li:has(.fa-chevron-down), ${config.selectors.sidebar} li:has(.fa-caret-down), ${config.selectors.sidebar} li.has-submenu`
    );

    for (const item of expandableItems) {
        try {
            await item.click({ timeout: 3000 });
            await page.waitForTimeout(500);
        } catch (_) {
            // ignore items that can't be clicked
        }
    }

    // Re-collect all links after expanding
    const expandedLinks = await page.$$eval(
        `${config.selectors.sidebar} a`,
        (anchors) => anchors.map(a => ({
            text: a.innerText?.trim() || a.title?.trim() || '',
            href: a.href || '',
        })).filter(a => a.text.length > 0 && a.href.length > 0)
    );

    // Deduplicate again
    const seenExpanded = new Set();
    const finalLinks = [];
    for (const link of expandedLinks) {
        const key = link.text.toLowerCase();
        if (!seenExpanded.has(key)) {
            seenExpanded.add(key);
            finalLinks.push(link);
        }
    }

    // ── 4. Visit each section and capture page title / heading ───────────────
    console.log('\n🌐 Visiting each section to capture details...');

    const sections = [];

    for (const link of finalLinks) {
        if (!link.href || link.href === '#' || link.href.startsWith('javascript')) continue;

        try {
            console.log(`   → Visiting: ${link.text} (${link.href})`);
            await page.goto(link.href, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(1500);

            // Capture page heading or title
            const heading = await page.$eval(
                'h1, h2, .page-title, .header-title, [class*="title"]',
                el => el.innerText?.trim() || ''
            ).catch(() => '');

            const pageTitle = await page.title().catch(() => '');

            // Capture visible interactive elements (buttons, inputs, tables)
            const interactiveElements = await page.$$eval(
                'button:visible, input:visible, table, [role="button"]:visible',
                (els) => els.slice(0, 10).map(el => ({
                    tag: el.tagName.toLowerCase(),
                    text: el.innerText?.trim().slice(0, 50) || el.placeholder || el.getAttribute('aria-label') || '',
                    type: el.type || '',
                })).filter(e => e.text.length > 0)
            ).catch(() => []);

            sections.push({
                name: link.text,
                url: link.href,
                heading,
                pageTitle,
                interactiveElements,
            });

        } catch (err) {
            console.warn(`   ⚠️  Could not visit ${link.text}: ${err.message}`);
            sections.push({
                name: link.text,
                url: link.href,
                heading: '',
                pageTitle: '',
                interactiveElements: [],
                error: err.message,
            });
        }
    }

    await browser.close();

    // ── 5. Save results ───────────────────────────────────────────────────────
    const result = {
        crawledAt: new Date().toISOString(),
        baseUrl: config.baseUrl,
        totalSections: sections.length,
        sections,
    };

    fs.writeFileSync(config.crawlResultPath, JSON.stringify(result, null, 2));
    console.log(`\n✅ Crawl complete. ${sections.length} sections saved to: ${config.crawlResultPath}`);

    return result;
}

// CLI entry point
if (require.main === module) {
    crawl().catch(err => {
        console.error('❌ Crawl failed:', err);
        process.exit(1);
    });
}

module.exports = crawl;
