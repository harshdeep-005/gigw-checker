/**
 * Integration test — run all currently-built checkers against a real .gov.in site.
 *
 * Fires:
 *   - Member A: axe-core checker (15 §5.2 accessibility clauses)
 *   - Member B: official-domain checker (5.1.1) + metadata checker (5.1.21)
 *
 * Prints a unified report grouped by section and clause.
 *
 * Usage: npx tsx scripts/integration-test.ts [url]
 * Default target: https://uidai.gov.in/
 */

import { chromium } from "playwright";
import { axeCoreChecker } from "../packages/checkers/accessibility/src/axe-core.js";
import { qualityLifecycleCheckers } from "../packages/checkers/quality-lifecycle/src/index.js";
import type { CheckerResult } from "@gigw/db";

const TARGET_URL = process.argv[2] ?? "https://uidai.gov.in/";

const STATUS_ICON: Record<string, string> = {
  pass: "✓",
  fail: "✗",
  needs_review: "?",
  not_applicable: "–",
};

const SEVERITY_PAD = { high: "high  ", medium: "medium", low: "low   " };

// ── helpers ──────────────────────────────────────────────────────────────────

function printSection(title: string, results: CheckerResult[]): void {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(70)}`);

  if (results.length === 0) {
    console.log("  (no results)");
    return;
  }

  // Sort: fail first, then needs_review, then pass, then not_applicable
  const order = { fail: 0, needs_review: 1, pass: 2, not_applicable: 3 };
  const sorted = [...results].sort(
    (a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4),
  );

  for (const r of sorted) {
    const icon = STATUS_ICON[r.status] ?? "?";
    const sev = SEVERITY_PAD[r.severity as keyof typeof SEVERITY_PAD] ?? r.severity;
    console.log(`  ${icon} [${sev}] ${r.clauseId.padEnd(22)} ${r.evidence.slice(0, 80)}`);
  }
}

function printSummary(
  label: string,
  results: CheckerResult[],
): { pass: number; fail: number; needs_review: number; not_applicable: number } {
  const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
  for (const r of results) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }
  const total = results.length;
  const score =
    total === 0
      ? 100
      : Math.round((counts.pass / (total - counts.not_applicable || 1)) * 100);
  console.log(
    `  ${label.padEnd(20)} total:${String(total).padStart(3)}  ` +
      `✓${String(counts.pass).padStart(3)}  ` +
      `✗${String(counts.fail).padStart(3)}  ` +
      `?${String(counts.needs_review).padStart(3)}  ` +
      `–${String(counts.not_applicable).padStart(3)}  ` +
      `score≈${String(score)}%`,
  );
  return counts;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  GIGW Integration Test — ${TARGET_URL}`);
  console.log(`  Checkers: axe-core (§5.2) + official-domain + metadata (§5.1)`);
  console.log(`${"═".repeat(70)}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`\nNavigating...`);
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

  const finalUrl = page.url();
  const html = await page.content();

  console.log(`  URL    : ${finalUrl}`);
  console.log(`  Title  : ${await page.title()}`);
  console.log(`  HTML   : ${String(html.length)} bytes`);

  const checkerCtx = { page, pageUrl: finalUrl, html };

  // ── Run Member A's checker ────────────────────────────────────────────────
  console.log(`\nRunning axe-core accessibility checker...`);
  const a11yResults = await axeCoreChecker.run(checkerCtx);

  // ── Run Member B's checkers ───────────────────────────────────────────────
  console.log(`Running quality-lifecycle checkers...`);
  const qlResults: CheckerResult[] = [];
  for (const checker of qualityLifecycleCheckers) {
    const results = await checker.run(checkerCtx);
    qlResults.push(...results);
  }

  // ── Results by section ────────────────────────────────────────────────────
  printSection("§5.1  Quality — automatable clauses (Member B PoC)", qlResults);
  printSection("§5.2  Accessibility — automatable clauses via axe-core (Member A)", a11yResults);

  // ── Summary table ─────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  SUMMARY`);
  console.log(`${"═".repeat(70)}`);

  const allResults = [...qlResults, ...a11yResults];
  printSummary("§5.1 Quality", qlResults);
  printSummary("§5.2 Accessibility", a11yResults);
  console.log(`  ${"─".repeat(65)}`);
  printSummary("TOTAL", allResults);

  // ── Failures highlighted ──────────────────────────────────────────────────
  const failures = allResults.filter((r) => r.status === "fail");
  const needsReview = allResults.filter((r) => r.status === "needs_review");

  if (failures.length > 0) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  FAILURES  (${String(failures.length)} — fix required)`);
    console.log(`${"═".repeat(70)}`);
    for (const r of failures) {
      console.log(`\n  ✗ [${r.severity}] Clause ${r.clauseId}`);
      console.log(`    ${r.evidence}`);
    }
  }

  if (needsReview.length > 0) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  NEEDS REVIEW  (${String(needsReview.length)} — manual verification required)`);
    console.log(`${"═".repeat(70)}`);
    for (const r of needsReview) {
      console.log(`  ? [${r.severity}] Clause ${r.clauseId}  ${r.evidence.slice(0, 100)}`);
    }
  }

  console.log(`\n${"═".repeat(70)}\n`);

  await context.close();
  await browser.close();
}

main().catch((err: unknown) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
