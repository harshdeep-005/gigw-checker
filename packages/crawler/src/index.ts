/**
 * @gigw/crawler
 *
 * BFS/DFS crawler using Playwright. Starts from a seed URL, stays
 * same-domain, respects robots.txt, and caps by depth + page count.
 * Writes discovered Routes to the DB via @gigw/db.
 *
 * Owned by: shared (both members). See design.md §2 and §6.
 *
 * TODO (A-003 / Phase 1):
 *  - Implement CrawlJob: accept seed URL + options, return Route[]
 *  - BFS queue with visited-set deduplication
 *  - robots.txt fetching + rule evaluation
 *  - Depth + page-count cap enforcement
 *  - Per-page timeout + retry logic (design.md §6: 15s, 2 retries)
 *  - Write Route records to DB on discovery
 */

export type { CrawlOptions, CrawlResult } from "./types.js";
