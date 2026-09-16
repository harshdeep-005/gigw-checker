/**
 * @gigw/aggregation
 *
 * Computes PageReport and SiteReport from raw CheckerResult[]
 * using the scoring formula defined in schema.md §6.
 *
 * Owner: Member B (initial build, reviewed by both). See design.md §2.
 *
 * Scoring formula (schema.md §6):
 *   severityWeight = { high: 3, medium: 2, low: 1 }
 *   pageScore = 100 * (sum of passed clause weights) / (sum of all applicable clause weights)
 *   overallScore = average of pageScore across all crawled pages
 *
 * TODO (Member B / Phase 2):
 *  - Implement computePageScore(results: CheckerResult[]): number
 *  - Implement buildPageReport(pageUrl, results): PageReport
 *  - Implement buildSiteReport(job, pageReports): SiteReport
 *  - Persist PageReport + SiteReport to DB via @gigw/db
 *  - Tune weights after Phase 3 real-world testing
 */

export { SEVERITY_WEIGHTS } from "./scoring.js";
export type { ScoringConfig } from "./scoring.js";
