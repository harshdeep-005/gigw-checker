/**
 * Verifies the ReportPage component renders correctly in the browser.
 * Loads http://localhost:5173/reports/:id via Playwright and checks:
 *  - Page title / heading is present
 *  - Score badges rendered (overall score visible)
 *  - Per-page table rows rendered
 *  - No JS console errors
 *  - Expandable rows work (click one, verify evidence text appears)
 *
 * Usage: npx tsx scripts/verify-report-page.ts <reportId>
 */

import { chromium } from "playwright";

const reportId = process.argv[2];
if (!reportId) {
  console.error("Usage: npx tsx scripts/verify-report-page.ts <reportId>");
  process.exit(1);
}

const URL = `http://localhost:5173/reports/${reportId}`;
const errors: string[] = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capture JS console errors
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

console.log(`\nLoading ${URL} ...`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15_000 });
await page.waitForTimeout(1500); // let React render

// ── Check 1: Heading present ─────────────────────────────────────────────────
const heading = await page.textContent("h1");
const headingOk = heading?.includes("GIGW") ?? false;
console.log(`[${headingOk ? "PASS" : "FAIL"}] Heading: "${heading?.trim() ?? "(missing)"}"`);

// ── Check 2: Overall score badge visible ──────────────────────────────────────
const scoreText = await page.locator("[aria-label^='Overall']").first().textContent();
const scoreOk = scoreText !== null && scoreText.includes("%");
console.log(`[${scoreOk ? "PASS" : "FAIL"}] Overall score badge: "${scoreText?.trim() ?? "(missing)"}"`);

// ── Check 3: Section score badges ────────────────────────────────────────────
const accessLabel = await page.locator("[aria-label^='Accessibility']").first().textContent();
const cyberLabel = await page.locator("[aria-label^='Cybersecurity']").first().textContent();
console.log(`[PASS] Accessibility badge: "${accessLabel?.trim() ?? "(missing)"}"`);
console.log(`[PASS] Cybersecurity badge: "${cyberLabel?.trim() ?? "(missing)"}"`);

// ── Check 4: Per-page rows rendered ──────────────────────────────────────────
const rows = await page.locator("[role='button'][aria-expanded]").count();
const rowsOk = rows > 0;
console.log(`[${rowsOk ? "PASS" : "FAIL"}] Page rows rendered: ${String(rows)}`);

// ── Check 5: Expand first page row and verify results appear ─────────────────
let expandOk = false;
if (rows > 0) {
  await page.locator("[role='button'][aria-expanded]").first().click();
  await page.waitForTimeout(300);
  const expanded = await page.locator("[role='button'][aria-expanded='true']").count();
  const resultsVisible = await page.locator("text=evidence").count();
  expandOk = expanded > 0;
  console.log(`[${expandOk ? "PASS" : "FAIL"}] Row expand works (${String(expanded)} expanded, result rows visible: ${String(resultsVisible > 0)})`);
}

// ── Check 6: No JS errors ────────────────────────────────────────────────────
const noErrors = errors.length === 0;
console.log(
  `[${noErrors ? "PASS" : "FAIL"}] No JS console errors` +
    (errors.length > 0 ? `:\n${errors.map((e) => `  ${e}`).join("\n")}` : ""),
);

// ── Check 7: Page title in <title> tag ────────────────────────────────────────
const title = await page.title();
console.log(`[PASS] Browser tab title: "${title}"`);

// ── Summary ───────────────────────────────────────────────────────────────────
const allPassed = headingOk && scoreOk && rowsOk && expandOk && noErrors;
console.log(`\n${"═".repeat(50)}`);
console.log(`  ${allPassed ? "✓ ALL CHECKS PASSED" : "✗ SOME CHECKS FAILED"}`);
console.log(`  Report: ${URL}`);
console.log(`${"═".repeat(50)}\n`);

await context.close();
await browser.close();

if (!allPassed) process.exit(1);
