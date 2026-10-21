/**
 * Local types for the quality-lifecycle dashboard view.
 * These mirror schema.md shapes but are plain TS (no Prisma dependency in the frontend).
 */

export type CheckStatus = "pass" | "fail" | "needs_review" | "not_applicable";
export type Severity = "high" | "medium" | "low";
export type Section = "quality" | "accessibility" | "cybersecurity" | "lifecycle";

export interface CheckerResultSummary {
  id: string;
  clauseId: string;
  pageUrl: string;
  status: CheckStatus;
  severity: Severity;
  evidence: string;
  checkedAt: string; // ISO string from API
}

export interface PageReportSummary {
  id: string;
  pageUrl: string;
  score: number;
  passCount: number;
  failCount: number;
  needsReview: number;
  notApplicable: number;
  results: CheckerResultSummary[];
}

export interface SiteReportSummary {
  id: string;
  siteUrl: string;
  crawlStartedAt: string;
  crawlFinishedAt: string | null;
  totalRoutesDiscovered: number;
  totalRoutesChecked: number;
  overallScore: number | null;
  scoreQuality: number | null;
  scoreAccessibility: number | null;
  scoreCybersecurity: number | null;
  scoreLifecycle: number | null;
  pages: PageReportSummary[];
}
