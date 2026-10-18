
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
 */

// Scoring primitives
export { SEVERITY_WEIGHTS, computePageScore } from "./scoring.js";
export type { ScoringConfig } from "./scoring.js";

// In-memory builders (pure, no DB — usable in tests)
export {
  buildPageReportData,
  buildSiteReportData,
  computeSectionScores,
} from "./aggregation.js";
export type {
  ResultSlice,
  SectionScores,
  PageReportData,
  SiteReportData,
} from "./aggregation.js";

// DB-persisting functions (require live Prisma client)
export { persistSiteReport, aggregateJob } from "./aggregation.js";
