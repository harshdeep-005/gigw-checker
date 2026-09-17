/**
 * Public types for the crawler package.
 * Route shape is defined in schema.md §4 — keep in sync.
 */

export interface CrawlOptions {
  seedUrl: string;
  depthCap?: number; // default: 5  (design.md §6)
  pageCap?: number; // default: 500 (design.md §6)
  timeoutMs?: number; // default: 15000
  retries?: number; // default: 2
}

export interface CrawlResult {
  jobId: string;
  routesDiscovered: number;
  routesFailed: number;
}
