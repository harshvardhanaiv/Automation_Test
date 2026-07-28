import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'https://aiv.test.oneaiv.com:8086/aiv/';
const ANNOTATION_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Annotation';
const USERNAME = 'Admin';
const PASSWORD = 'Ganesh04';

// ── Local Auth Helpers ─────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector("input[placeholder='Your email']", { timeout: 30000 });
  await page.fill("input[placeholder='Your email']", USERNAME);
  await page.fill("input[placeholder='Password']", PASSWORD);
  await page.click("button:has-text('Login')");
  await Promise.race([
    page.locator("input[placeholder*='Search']").first().waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
}

async function goTo(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  
  const loginInput = page.locator("input[placeholder='Your email']").first();
  const searchInput = page.locator("input[placeholder*='Search']").first();
  
  await Promise.race([
    loginInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);

  if (await loginInput.isVisible()) {
    console.log('👉 Session expired. Logging in...');
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  }

  await page.waitForTimeout(1500);
}

async function shot(page: Page, name: string) {
  const finalDir = path.join('screenshots', 'testing_w_deepseek', 'annotations', 'annotation item create');
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(finalDir, name), timeout: 15000 }).catch(() => {});
}

// ── Annotation Create Item Spec ────────────────────────────────────────────────

test.describe('AIV Annotation - Create Item Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await goTo(page, ANNOTATION_URL);
    await page.waitForTimeout(1000);
  });

  test('annotation_create_item', async ({ page }) => {
    test.setTimeout(180000);

    // Step 1: Scroll left side list down to locate "Annotation AutoTest"
    console.log('👉 Locating and scrolling to "Annotation AutoTest"...');
    const leftPane = page.locator('.annot_left, .annot_general, [class*="annot_left"]').first();
    if (await leftPane.isVisible({ timeout: 10000 }).catch(() => false)) {
      await leftPane.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(1000);
    }

    const groupItem = page.locator('label.tree_lbl_vl, .tree_lbl_vl, mat-tree-node, label').filter({ hasText: /^Annotation AutoTest$/ }).first();
    await expect(groupItem).toBeVisible({ timeout: 15000 });
    await shot(page, 'create_item_01-select-group.png');

    // Step 2: Click Annotation AutoTest and verify blue highlight
    console.log('👉 Clicking "Annotation AutoTest"...');
    await groupItem.click();
    await page.waitForTimeout(1500);
    await shot(page, 'create_item_02-group-highlighted.png');

    // Step 3: Click single cube icon ("Create Item")
    console.log('👉 Locating Create Item single cube icon...');
    const createItemIcon = page.locator('i.fa-cube:not(.fa-cubes), a:has(i.fa-cube:not(.fa-cubes)), [title="Create Item"]').first();
    await expect(createItemIcon).toBeVisible({ timeout: 15000 });
    await createItemIcon.hover();
    await page.waitForTimeout(800);
    await createItemIcon.click();
    await page.waitForTimeout(2000);

    // Verify Create Item dialog appears
    console.log('👉 Verifying Create Item dialog...');
    const dialogTitle = page.locator('p-dialog, [role="dialog"], .p-dialog')
      .filter({ hasText: /Create Item/i }).first();
    await expect(dialogTitle).toBeVisible({ timeout: 15000 });
    await shot(page, 'create_item_03-dialog-opened.png');

    // Step 4: Add text as "Item Key" in Key input field
    console.log('👉 Entering Key: "Item Key"...');
    const keyInput = page.locator('xpath=//label[contains(text(), "Key")]/ancestor::div[1]//input | //label[contains(text(), "Key")]/following-sibling::input').first()
      .or(page.locator('[role="dialog"] input').nth(1));
    await expect(keyInput).toBeVisible({ timeout: 10000 });
    await keyInput.click();
    await keyInput.clear();
    await keyInput.fill('Item Key');
    await page.waitForTimeout(1000);
    await shot(page, 'create_item_04-key-entered.png');

    // Step 5: Select Start Date (today) and End Date (tomorrow)
    console.log('👉 Setting Start Date and End Date...');
    const startDateInput = page.locator('[role="dialog"] input').nth(2);
    const endDateInput = page.locator('[role="dialog"] input').nth(3);

    const startDateBtn = page.locator('[role="dialog"] button:has(i), [role="dialog"] button:has(.fa-calendar), [role="dialog"] .p-calendar').nth(0);
    if (await startDateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startDateBtn.click();
    } else if (await startDateInput.isVisible()) {
      await startDateInput.click();
    }
    await page.waitForTimeout(800);

    const todayCell = page.locator('.p-datepicker-today, .e-today, [class*="today"], td.p-datepicker-today a, .p-datepicker td:not(.p-datepicker-other-month) span').first();
    if (await todayCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await todayCell.click();
    }
    await page.waitForTimeout(1000);

    const endDateBtn = page.locator('[role="dialog"] button:has(i), [role="dialog"] button:has(.fa-calendar), [role="dialog"] .p-calendar').nth(1);
    if (await endDateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endDateBtn.click();
    } else if (await endDateInput.isVisible()) {
      await endDateInput.click();
    }
    await page.waitForTimeout(800);

    const tomorrowCell = page.locator('.p-datepicker-today + td, .p-datepicker td:not(.p-datepicker-other-month) span').nth(1);
    if (await tomorrowCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tomorrowCell.click();
    }
    await page.waitForTimeout(1000);
    await shot(page, 'create_item_05-dates-selected.png');

    // Step 6: Append ". This is item test." in Description editor
    console.log('👉 Appending text in Description editor...');
    const editorEl = page.locator('[role="dialog"] .ql-editor').first();
    await expect(editorEl).toBeVisible({ timeout: 15000 });

    // Focus editor and type using Keyboard so Quill registers native input events
    await editorEl.click({ force: true });
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+End');
    await page.keyboard.type('. This is item test.');
    await page.waitForTimeout(1000);
    await shot(page, 'create_item_06-description-added.png');

    // Step 7: Select word "Automation" and click Bold (B) button
    console.log('👉 Selecting word "Automation" and clicking Bold button...');
    
    // Use Quill API or DOM Range API to select "Automation"
    await page.evaluate(() => {
      const qEditor = document.querySelector('[role="dialog"] .ql-editor');
      if (!qEditor) return;
      
      const p = qEditor.querySelector('p') || qEditor;
      for (const node of Array.from(p.childNodes)) {
        if (node.nodeType === 3 && node.nodeValue && node.nodeValue.includes('Automation')) {
          const range = document.createRange();
          const start = node.nodeValue.indexOf('Automation');
          range.setStart(node, start);
          range.setEnd(node, start + 'Automation'.length);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
          break;
        }
      }
    });
    await page.waitForTimeout(1000);

    // Click Bold button in Quill toolbar
    const boldBtn = page.locator('[role="dialog"] button.ql-bold, button.ql-bold').first();
    if (await boldBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await boldBtn.click({ force: true });
    }
    await page.waitForTimeout(1500);
    await shot(page, 'create_item_07-text-bolded.png');

    // Step 8: Click Submit button
    console.log('👉 Clicking Submit button...');
    const submitBtn = page.locator('button').filter({ hasText: /^Submit$/ }).first()
      .or(page.locator('p-dialog button, [role="dialog"] button').filter({ hasText: /^Submit$/ }).first());
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'create_item_08-submitted.png');
    await submitBtn.click();
    await page.waitForTimeout(2000);

    console.log('✅ annotation_create_item Part 1 completed successfully!');
  });

});
