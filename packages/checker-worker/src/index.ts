/**
 * Check worker — BullMQ worker that picks up CheckJobs, runs ALL checkers
 * (§5.1 Quality, §5.2 Accessibility, §5.3 Cybersecurity, §5.4 Lifecycle)
 * against the target page, writes CheckerResult rows to DB, and triggers
 * aggregation when all checks for a job are complete.
 *
 * This is where Member A's and Member B's work meets.
 *
 * Owner: shared. See design.md §2.
 *
 * Run alongside crawl-worker:
 *   node packages/crawler/dist/crawl-worker.js
 *   node packages/checker-worker/dist/index.js
 */

import "dotenv/config";
import { chromium } from "playwright";
import { createCheckWorker, closeQueues } from "@gigw/queue";
import { prisma } from "@gigw/db";
import { Prisma } from "@prisma/client";
import type { JobStatus } from "@gigw/db";
import { accessibilityCheckers } from "@gigw/checker-accessibility";
import { cybersecurityCheckers } from "@gigw/checker-cybersecurity";
import { qualityLifecycleCheckers } from "@gigw/checker-quality-lifecycle";
import { aggregateJob } from "@gigw/aggregation";

// All checkers in run order — quality first (cheapest), accessibility second,
// cybersecurity last (makes network requests)
const ALL_CHECKERS = [
  ...qualityLifecycleCheckers, // §5.1 + §5.4 — Member B
  ...accessibilityCheckers, // §5.2 — Member A
  ...cybersecurityCheckers, // §5.3 — Member A
];

console.log(
  `[check-worker] Loaded ${String(ALL_CHECKERS.length)} checkers ` +
    `(${String(qualityLifecycleCheckers.length)} quality-lifecycle, ` +
    `${String(accessibilityCheckers.length)} accessibility, ` +
    `${String(cybersecurityCheckers.length)} cybersecurity)`,
);

const worker = createCheckWorker(async (payload) => {
  const { jobId, routeUrl } = payload;

  console.log(`[check-worker] Checking ${routeUrl} (job: ${jobId})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // Navigate to the route
    await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const html = await page.content();
    // Use routeUrl (not finalUrl) for pageUrl — the crawler stored this URL in
    // the Route table, and aggregation matches results by route URL. Using the
    // redirected finalUrl would break the join.
    const ctx = { page, pageUrl: routeUrl, html };

    // Run all checkers — errors in individual checkers don't abort the run
    for (const checker of ALL_CHECKERS) {
      try {
        const results = await checker.run(ctx);
        for (const result of results) {
          await prisma.checkerResult.create({
            data: {
              clauseId: result.clauseId,
              pageUrl: result.pageUrl,
              status: result.status,
              severity: result.severity,
              evidence: result.evidence,
              detail: result.detail ?? Prisma.DbNull,
              checkedAt: result.checkedAt,
            },
          });
        }
      } catch (checkerErr) {
        // Log but don't fail the whole check job for one checker error
        console.error(
          `[check-worker] Checker ${checker.checkerId} failed on ${routeUrl}:`,
          checkerErr,
        );
      }
    }

    console.log(`[check-worker] Done checking ${routeUrl}`);
  } finally {
    await context.close();
    await browser.close();
  }

  // ── Check if all check jobs for this crawl job are done ──────────────────
  // Compare DB counts only (no reliance on global queue counts which mix across jobs)
  const jobRouteUrls = (
    await prisma.route.findMany({
      where: { jobId, status: "crawled" },
      select: { url: true },
    })
  ).map((r: { url: string }) => r.url);

  const totalRoutes = jobRouteUrls.length;

  const checkedPages = await prisma.checkerResult.groupBy({
    by: ["pageUrl"],
    where: { pageUrl: { in: jobRouteUrls } },
  });

  const allPagesChecked = checkedPages.length >= totalRoutes && totalRoutes > 0;

  if (allPagesChecked) {
    // Guard: skip if already aggregating/done/failed
    const currentJob = await prisma.crawlJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    const alreadyDone =
      currentJob?.status === "aggregating" ||
      currentJob?.status === "done" ||
      currentJob?.status === "failed";

    if (!alreadyDone) {
      console.log(
        `[check-worker] All ${String(totalRoutes)} routes checked for job ${jobId} — aggregating...`,
      );

      await prisma.crawlJob.update({
        where: { id: jobId },
        data: { status: "aggregating" as JobStatus },
      });

      try {
        await aggregateJob(jobId, totalRoutes);
        console.log(`[check-worker] Aggregation complete for job ${jobId}`);
      } catch (aggErr) {
        console.error(`[check-worker] Aggregation failed for job ${jobId}:`, aggErr);
        await prisma.crawlJob.update({
          where: { id: jobId },
          data: { status: "failed" as JobStatus },
        });
      }
    }
  }
}, 3); // 3 concurrent page checks

worker.on("failed", (job, err) => {
  console.error(`[check-worker] BullMQ job ${job?.id ?? "unknown"} failed:`, err);
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log("[check-worker] Shutting down...");
  await worker.close();
  await closeQueues();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});

console.log("[check-worker] Ready — listening on gigw-check queue");
