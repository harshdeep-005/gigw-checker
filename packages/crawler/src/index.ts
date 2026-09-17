/**
 * @gigw/crawler
 *
 * BFS crawler using Playwright. Starts from a seed URL, stays
 * same-domain, respects robots.txt, and caps by depth + page count.
 * Writes discovered Routes to the DB via @gigw/db.
 *
 * Owned by: shared (both members). See design.md §2 and §6.
 */

export { crawl } from "./crawler.js";
export type { CrawlOptions, CrawlResult } from "./types.js";
