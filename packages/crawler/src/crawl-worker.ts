/**
 * Crawl worker — BullMQ worker that picks up CrawlJobs, runs the BFS crawler,
 * and enqueues a CheckJob for every discovered route.
 *
 * Run this process alongside the check worker to form the full pipeline:
 *   POST /jobs → CRAWL_QUEUE → crawl-worker → CHECK_QUEUE → check-worker
 *                                                              → aggregateJob
 *
 * Owner: shared. See design.md §2.
 */

import "dotenv/config";
import { createCrawlWorker, addCheckJob, closeQueues } from "@gigw/queue";
import { crawl } from "./crawler.js";
import type { CrawlOptions } from "./types.js";
import { prisma } from "@gigw/db";
import { type JobStatus } from "@gigw/db";

const worker = createCrawlWorker(async (rawPayload) => {
  // Cast through unknown to satisfy strict ESLint — the queue guarantees this shape
  const payload = rawPayload as unknown as { jobId: string; options: CrawlOptions };
  const jobId = payload.jobId;
  const options = payload.options;

  console.log(`[crawl-worker] Starting job ${jobId} — seed: ${String(options.seedUrl)}`);

  // Mark job as crawling
  await prisma.crawlJob.update({
    where: { id: jobId },
    data: { status: "crawling" as JobStatus },
  });

  let routesDiscovered = 0;

  try {
    // Run the BFS crawler — writes Route rows to DB as it discovers pages
    const result = await crawl(jobId, options);
    routesDiscovered = result.routesDiscovered;

    console.log(
      `[crawl-worker] Job ${jobId} crawl complete — ` +
        `${String(routesDiscovered)} routes discovered, ` +
        `${String(result.routesFailed)} failed`,
    );

    // Mark job as checking
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "checking" as JobStatus,
        // Store route count for aggregation later
      },
    });

    // Enqueue a CheckJob for every crawled route
    const routes = await prisma.route.findMany({
      where: { jobId, status: "crawled" },
      select: { url: true, depth: true },
    });

    console.log(`[crawl-worker] Enqueuing ${String(routes.length)} check jobs for ${jobId}`);

    for (const route of routes) {
      await addCheckJob({
        jobId,
        routeUrl: route.url,
        depth: route.depth,
      });
    }

    // Store total routes discovered on the job for aggregation
    // We use a convention: stash it in the job's updatedAt by touching the record
    // The check worker reads route count directly from the DB
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "checking" as JobStatus },
    });
  } catch (err) {
    console.error(`[crawl-worker] Job ${jobId} failed:`, err);
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "failed" as JobStatus },
    });
    throw err; // let BullMQ retry
  }
}, 2); // max 2 concurrent crawls

worker.on("failed", (job, err) => {
  console.error(`[crawl-worker] BullMQ job ${job?.id ?? "unknown"} failed:`, err);
});

worker.on("completed", (job) => {
  console.log(`[crawl-worker] BullMQ job ${job.id ?? "unknown"} completed`);
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log("[crawl-worker] Shutting down...");
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

console.log("[crawl-worker] Ready — listening on gigw-crawl queue");
