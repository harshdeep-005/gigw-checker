/**
 * Integration test — run ALL built checkers against a real site.
 *
 * Sections covered:
 *   §5.1 Quality          — Member B (2 PoC checkers)
 *   §5.2 Accessibility    — Member A (17 checkers: axe-core + 16 semi-auto)
 *   §5.3 Cybersecurity    — Member A (7 checkers: passive only)
 *
 * Usage:  npx tsx scripts/integration-test.ts [url]
 * Default: https://uidai.gov.in/
 */

import { chromium } from "playwright";
import { accessibilityCheckers } from "../packages/checkers/accessibility/src/index.js";
import { cybersecurityCheckers } from "../packages/checkers/cybersecurity/src/index.js";
import { qualityLifecycleCheckers } from "../packages/checkers/quality-lifecycle/src/index.js";
import type { CheckerResultData } from "../packages/checkers/accessibility/src/types.js";

const TARGET_URL = process.argv[2] ?? "https://uidai.gov.in/";

const STATUS_ICON: Record<string, string> = {
  pass: "✓",
  fail: "✗",
  needs_review: "?",
  not_applicable: "–",
};

const SEVERITY_PAD: Record<string, string> = {
  high: "high  ",
  medium: "medium",
  low: "low   ",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function printSection(title: string, results: CheckerResultData[]): void {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(70)}`);

  if (results.length === 0) {
    console.log("  (no results)");
    return;
  }

  const order: Record<string, number> = { fail: 0, needs_review: 1, pass: 2, not_applicable: 3 };
  const sorted = [...results].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));

  for (const r of sorted) {
    const icon = STATUS_ICON[r.status] ?? "?";
    const sev = SEVERITY_PAD[r.severity] ?? r.severity;
    console.log(`  ${icon} [${sev}] ${r.clauseId.padEnd(22)} ${r.evidence.slice(0, 80)}`);
  }
}

function printSummary(label: string, results: CheckerResultData[]): void {
  const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
  for (const r of results) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }
  const applicable = results.length - counts.not_applicable;
  const score = applicable === 0 ? 0 : Math.round((counts.pass / applicable) * 100);
  console.log(
    `  ${label.padEnd(22)} total:${String(results.length).padStart(3)}` +
      `  ✓${String(counts.pass).padStart(3)}` +
      `  ✗${String(counts.fail).padStart(3)}` +
      `  ?${String(counts.needs_review).padStart(3)}` +
      `  –${String(counts.not_applicable).padStart(3)}` +
      `  score≈${String(score)}%`,
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  GIGW Phase 2 Integration Test`);
  console.log(`  Target: ${TARGET_URL}`);
  console.log(
    `  Checkers: ${String(accessibilityCheckers.length)} §5.2` +
      ` + ${String(cybersecurityCheckers.length)} §5.3` +
      ` + ${String(qualityLifecycleCheckers.length)} §5.1`,
  );
  console.log(`${"═".repeat(70)}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`\nNavigating to ${TARGET_URL} ...`);
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

  const finalUrl = page.url();
  const html = await page.content();
  console.log(`  Landed at : ${finalUrl}`);
  console.log(`  Title     : ${await page.title()}`);
  console.log(`  HTML size : ${String(html.length)} bytes`);

  const ctx = { page, pageUrl: finalUrl, html };

  // ── §5.1 Quality ─────────────────────────────────────────────────────────
  console.log(`\nRunning §5.1 Quality checkers...`);
  const qlResults: CheckerResultData[] = [];
  for (const checker of qualityLifecycleCheckers) {
    try {
      qlResults.push(...(await checker.run(ctx)));
    } catch (err) {
      console.error(`  [ERROR] ${checker.checkerId}: ${String(err)}`);
    }
  }

  // ── §5.2 Accessibility ────────────────────────────────────────────────────
  console.log(`Running §5.2 Accessibility checkers (${String(accessibilityCheckers.length)})...`);
  const a11yResults: CheckerResultData[] = [];
  for (const checker of accessibilityCheckers) {
    try {
      a11yResults.push(...(await checker.run(ctx)));
    } catch (err) {
      console.error(`  [ERROR] ${checker.checkerId}: ${String(err)}`);
    }
  }

  // ── §5.3 Cybersecurity ────────────────────────────────────────────────────
  console.log(`Running §5.3 Cybersecurity checkers (${String(cybersecurityCheckers.length)})...`);
  const secResults: CheckerResultData[] = [];
  for (const checker of cybersecurityCheckers) {
    try {
      secResults.push(...(await checker.run(ctx)));
    } catch (err) {
      console.error(`  [ERROR] ${checker.checkerId}: ${String(err)}`);
    }
  }

  await context.close();
  await browser.close();

  // ── Results by section ────────────────────────────────────────────────────
  printSection(`§5.1  Quality (${String(qlResults.length)} results)`, qlResults);
  printSection(`§5.2  Accessibility (${String(a11yResults.length)} results)`, a11yResults);
  printSection(`§5.3  Cybersecurity (${String(secResults.length)} results)`, secResults);

  // ── Summary ───────────────────────────────────────────────────────────────
  const all = [...qlResults, ...a11yResults, ...secResults];
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  SUMMARY`);
  console.log(`${"═".repeat(70)}`);
  printSummary("§5.1 Quality", qlResults);
  printSummary("§5.2 Accessibility", a11yResults);
  printSummary("§5.3 Cybersecurity", secResults);
  console.log(`  ${"─".repeat(67)}`);
  printSummary("TOTAL", all);

  // ── Failures ─────────────────────────────────────────────────────────────
  const failures = all.filter((r) => r.status === "fail");
  if (failures.length > 0) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  FAILURES  (${String(failures.length)} — fix required)`);
    console.log(`${"═".repeat(70)}`);
    for (const r of failures) {
      console.log(`\n  ✗ [${r.severity}] ${r.clauseId}`);
      console.log(`    ${r.evidence}`);
    }
  }

  // ── Needs review ─────────────────────────────────────────────────────────
  const review = all.filter((r) => r.status === "needs_review");
  if (review.length > 0) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  NEEDS REVIEW  (${String(review.length)} — manual verification required)`);
    console.log(`${"═".repeat(70)}`);
    for (const r of review) {
      console.log(`  ? [${r.severity}] ${r.clauseId.padEnd(22)} ${r.evidence.slice(0, 90)}`);
    }
  }

  console.log(`\n${"═".repeat(70)}\n`);
}

main().catch((err: unknown) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
