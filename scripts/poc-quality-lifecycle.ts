/**
 * Phase 1 PoC — Quality-Lifecycle checkers against a real .gov.in site.
 *
 * Mirrors Member A's axe-core PoC approach (brain/member-a.md, 2026-08-21).
 * Run with: npx tsx scripts/poc-quality-lifecycle.ts
 *
 * Target: uidai.gov.in (confirmed bot-friendly by Member A)
 */

import { chromium } from "playwright";
import { qualityLifecycleCheckers } from "../packages/checkers/quality-lifecycle/src/index.js";

const TARGET_URL = "https://www.nitj.ac.in/";

async function main(): Promise<void> {
  console.log(`\n=== Quality-Lifecycle PoC — ${TARGET_URL} ===\n`);

  const browser = await chromium.launch({ headless: true });
  // Must use newContext() + context.newPage(), not browser.newPage() directly
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  const html = await page.content();
  const pageUrl = page.url(); // may differ from TARGET_URL after redirects

  console.log(`Loaded: ${pageUrl}  (${html.length} bytes)\n`);

  const checkerCtx = { page, pageUrl, html };

  let totalResults = 0;

  for (const checker of qualityLifecycleCheckers) {
    console.log(`── Checker: ${checker.checkerId}  (clauses: ${checker.clauseIds.join(", ")})`);
    const results = await checker.run(checkerCtx);
    totalResults += results.length;

    for (const r of results) {
      const icon = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "?";
      console.log(
        `   ${icon} [${r.status.padEnd(14)}] [${r.severity.padEnd(6)}] ${r.evidence}`,
      );
      if (r.detail !== null && r.detail !== undefined) {
        console.log(`     detail: ${JSON.stringify(r.detail)}`);
      }
    }
    console.log();
  }

  console.log(`── Summary`);
  console.log(`   Checkers run : ${qualityLifecycleCheckers.length}`);
  console.log(`   Total results: ${totalResults}`);

  await context.close();
  await browser.close();
}

main().catch((err: unknown) => {
  console.error("PoC failed:", err);
  process.exit(1);
});
