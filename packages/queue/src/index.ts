/**
 * @gigw/queue
 *
 * BullMQ job queue wiring. Exposes typed queue instances for:
 *  - crawl jobs (crawl a site from a seed URL)
 *  - check jobs (run checkers on a single discovered route)
 *
 * Owned by: shared (both members). See design.md §2.
 *
 * TODO (A-003 / Phase 1):
 *  - Define CRAWL_QUEUE and CHECK_QUEUE BullMQ instances
 *  - Define typed job payloads (CrawlJobPayload, CheckJobPayload)
 *  - Export worker factory helpers
 *  - Configure retry / backoff strategy
 */

export type { CrawlJobPayload, CheckJobPayload } from "./types.js";
