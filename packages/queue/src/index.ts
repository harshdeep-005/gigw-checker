/**
 * @gigw/queue
 *
 * BullMQ job queue wiring. Exposes typed queue + worker factories for:
 *  - crawl jobs  (crawl a site from a seed URL)
 *  - check jobs  (run checkers on a single discovered route)
 *
 * Owned by: shared (both members). See design.md §2.
 *
 * Usage:
 *   import { addCrawlJob, createCrawlWorker } from "@gigw/queue";
 */

import { Queue, Worker, type ConnectionOptions } from "bullmq";
import type { CrawlJobPayload, CheckJobPayload } from "./types.js";

// ── Redis connection ──────────────────────────────────────────────────────────

function getRedisConnection(): ConnectionOptions {
  const url = process.env["REDIS_URL"] ?? "redis://localhost:6379";
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
    };
  } catch {
    // Fallback if URL is malformed
    return { host: "localhost", port: 6379 };
  }
}

// ── Queue names ───────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  CRAWL: "gigw:crawl",
  CHECK: "gigw:check",
} as const;

// ── Retry / backoff config ────────────────────────────────────────────────────

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5_000, // 5s, 10s, 20s
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

// ── Queue instances (lazy-created singletons) ─────────────────────────────────

let crawlQueue: Queue<CrawlJobPayload> | null = null;
let checkQueue: Queue<CheckJobPayload> | null = null;

export function getCrawlQueue(): Queue<CrawlJobPayload> {
  if (!crawlQueue) {
    crawlQueue = new Queue<CrawlJobPayload>(QUEUE_NAMES.CRAWL, {
      connection: getRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return crawlQueue;
}

export function getCheckQueue(): Queue<CheckJobPayload> {
  if (!checkQueue) {
    checkQueue = new Queue<CheckJobPayload>(QUEUE_NAMES.CHECK, {
      connection: getRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return checkQueue;
}

// ── Job helpers ───────────────────────────────────────────────────────────────

/** Enqueue a crawl job. Returns the BullMQ job ID. */
export async function addCrawlJob(payload: CrawlJobPayload): Promise<string> {
  const job = await getCrawlQueue().add("crawl", payload, {
    jobId: payload.jobId, // use our DB jobId as BullMQ job ID for easy lookup
  });
  return job.id ?? payload.jobId;
}

/** Enqueue a check job for a single route. */
export async function addCheckJob(payload: CheckJobPayload): Promise<string> {
  const job = await getCheckQueue().add("check", payload);
  return job.id ?? `${payload.jobId}:${payload.routeUrl}`;
}

// ── Worker factories ──────────────────────────────────────────────────────────

type CrawlProcessor = (payload: CrawlJobPayload) => Promise<void>;
type CheckProcessor = (payload: CheckJobPayload) => Promise<void>;

/**
 * Create a BullMQ worker for crawl jobs.
 * Pass your processor function; the worker handles retries + concurrency.
 */
export function createCrawlWorker(
  processor: CrawlProcessor,
  concurrency = 2,
): Worker<CrawlJobPayload> {
  return new Worker<CrawlJobPayload>(QUEUE_NAMES.CRAWL, async (job) => processor(job.data), {
    connection: getRedisConnection(),
    concurrency,
  });
}

/**
 * Create a BullMQ worker for check jobs.
 * Higher concurrency is safe — each check job processes one route.
 */
export function createCheckWorker(
  processor: CheckProcessor,
  concurrency = 5,
): Worker<CheckJobPayload> {
  return new Worker<CheckJobPayload>(QUEUE_NAMES.CHECK, async (job) => processor(job.data), {
    connection: getRedisConnection(),
    concurrency,
  });
}

/** Gracefully close both queues (call on process shutdown). */
export async function closeQueues(): Promise<void> {
  await Promise.all([crawlQueue?.close(), checkQueue?.close()]);
}

export type { CrawlJobPayload, CheckJobPayload } from "./types.js";
