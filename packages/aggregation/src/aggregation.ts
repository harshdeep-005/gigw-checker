/**
 * buildPageReport and buildSiteReport — schema.md §5 / §6.
 * Owner: Member B (B-003). See design.md §2.
 *
 * Called by the CHECK_QUEUE worker after all checker results for a job have
 * been written to the DB. Persists PageReport and SiteReport rows and updates
 * the CrawlJob status to "done".
 */

import { prisma, ClauseCategory, JobStatus } from "@gigw/db";
import type { CrawlJob, PageReport, SiteReport } from "@gigw/db";
import { computePageScore } from "./scoring.js";

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * The minimal shape produced by checkers and stored in the DB.
 * Uses Omit to keep it in sync with CheckerResultData from checker packages —
 * id and pageReportId are excluded because:
 *   - id: DB-assigned on insert (never set by checkers)
 *   - pageReportId: set during aggregation
 *
 * When fetched from DB (in aggregateJob), real IDs are present.
 * The `id` field is typed as string here because aggregateJob fetches from DB.
 */
export interface ResultSlice {
  id: string; // real cuid when fetched from DB; never "" in this type
  clauseId: string;
  pageUrl: string;
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  severity: "high" | "medium" | "low";
  evidence: string;
  checkedAt: Date;
}

/** Section score breakdown keyed by ClauseCategory.
 *  null means no checkers ran for that section — not evaluated, not 100. */
export interface SectionScores {
  quality: number | null;
  accessibility: number | null;
  cybersecurity: number | null;
  lifecycle: number | null;
}

/** In-memory representation before DB persistence. */
export interface PageReportData {
  pageUrl: string;
  score: number;
  passCount: number;
  failCount: number;
  needsReview: number;
  notApplicable: number;
  results: ResultSlice[];
}

export interface SiteReportData {
  siteUrl: string;
  crawlStartedAt: Date;
  crawlFinishedAt: Date;
  totalRoutesDiscovered: number;
  totalRoutesChecked: number;
  overallScore: number;
  sectionScores: SectionScores;
  pages: PageReportData[];
}

// ── In-memory builders ───────────────────────────────────────────────────────

/**
 * Build an in-memory PageReportData from a flat list of CheckerResults for
 * a single page. Does not touch the DB.
 */
export function buildPageReportData(pageUrl: string, results: ResultSlice[]): PageReportData {
  const pageResults = results.filter((r) => r.pageUrl === pageUrl);

  let passCount = 0;
  let failCount = 0;
  let needsReview = 0;
  let notApplicable = 0;

  for (const r of pageResults) {
    if (r.status === "pass") passCount++;
    else if (r.status === "fail") failCount++;
    else if (r.status === "needs_review") needsReview++;
    else notApplicable++; // only remaining status is "not_applicable"
  }

  const score = computePageScore(pageResults);

  return { pageUrl, score, passCount, failCount, needsReview, notApplicable, results: pageResults };
}

/**
 * Compute per-section scores from a flat list of results and a clause-to-section map.
 * Results whose clauseId is not in the map are ignored (shouldn't happen after seeding).
 */
export function computeSectionScores(
  results: ResultSlice[],
  clauseSectionMap: Map<string, ClauseCategory>,
): SectionScores {
  // Bucket results by section — typed as a plain object to satisfy
  // noUncheckedIndexedAccess (we guarantee all four keys exist on creation)
  const quality: ResultSlice[] = [];
  const accessibility: ResultSlice[] = [];
  const cybersecurity: ResultSlice[] = [];
  const lifecycle: ResultSlice[] = [];

  for (const r of results) {
    const section = clauseSectionMap.get(r.clauseId);
    if (section === ClauseCategory.quality) quality.push(r);
    else if (section === ClauseCategory.accessibility) accessibility.push(r);
    else if (section === ClauseCategory.cybersecurity) cybersecurity.push(r);
    else if (section === ClauseCategory.lifecycle) lifecycle.push(r);
  }

  return {
    quality: quality.length > 0 ? computePageScore(quality) : null,
    accessibility: accessibility.length > 0 ? computePageScore(accessibility) : null,
    cybersecurity: cybersecurity.length > 0 ? computePageScore(cybersecurity) : null,
    lifecycle: lifecycle.length > 0 ? computePageScore(lifecycle) : null,
  };
}

/**
 * Build an in-memory SiteReportData from a list of PageReportData and all
 * raw results (for section scoring). Does not touch the DB.
 */
export function buildSiteReportData(
  job: Pick<CrawlJob, "seedUrl" | "createdAt">,
  pages: PageReportData[],
  allResults: ResultSlice[],
  clauseSectionMap: Map<string, ClauseCategory>,
  totalRoutesDiscovered: number,
): SiteReportData {
  // Average page scores; treat an empty site as 100 (no violations found)
  const overallScore =
    pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + p.score, 0) / pages.length) : 100;

  const sectionScores = computeSectionScores(allResults, clauseSectionMap);

  return {
    siteUrl: job.seedUrl,
    crawlStartedAt: job.createdAt,
    crawlFinishedAt: new Date(),
    totalRoutesDiscovered,
    totalRoutesChecked: pages.length,
    overallScore,
    sectionScores,
    pages,
  };
}

// ── DB persistence ───────────────────────────────────────────────────────────

/**
 * Persist a SiteReportData to the DB.
 *
 * Creates a SiteReport row and nested PageReport rows, linking all existing
 * CheckerResult rows (by id) to their PageReport. Also transitions the
 * CrawlJob status to "done".
 *
 * Returns the fully-created SiteReport (with pages included).
 */
export async function persistSiteReport(
  jobId: string,
  data: SiteReportData,
): Promise<SiteReport & { pages: PageReport[] }> {
  // Run everything in a transaction so partial failures don't leave stale rows
  // The callback parameter type is inferred from prisma.$transaction — we extract it
  // explicitly to satisfy noImplicitAny without importing the Prisma namespace.
  type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

  return prisma.$transaction(async (tx: TxClient) => {
    // 1. Create the SiteReport shell (no pages yet)
    const siteReport = await tx.siteReport.create({
      data: {
        siteUrl: data.siteUrl,
        crawlStartedAt: data.crawlStartedAt,
        crawlFinishedAt: data.crawlFinishedAt,
        totalRoutesDiscovered: data.totalRoutesDiscovered,
        totalRoutesChecked: data.totalRoutesChecked,
        overallScore: data.overallScore,
        scoreQuality: data.sectionScores.quality, // null = not evaluated
        scoreAccessibility: data.sectionScores.accessibility,
        scoreCybersecurity: data.sectionScores.cybersecurity,
        scoreLifecycle: data.sectionScores.lifecycle,
        jobId,
      },
    });

    // 2. Create PageReport rows and connect existing CheckerResults to them
    const pageReports: PageReport[] = [];
    for (const page of data.pages) {
      // Guard: only connect results that have a real DB-assigned id.
      // An empty id means the result was never persisted — skip it to avoid
      // a Prisma connect on id:"" which would fail or corrupt the table.
      const resultIds = page.results.filter((r) => r.id.length > 0).map((r) => ({ id: r.id }));
      const pageReport = await tx.pageReport.create({
        data: {
          pageUrl: page.pageUrl,
          score: page.score,
          passCount: page.passCount,
          failCount: page.failCount,
          needsReview: page.needsReview,
          notApplicable: page.notApplicable,
          siteReportId: siteReport.id,
          // Connect already-persisted CheckerResult rows
          results: { connect: resultIds },
        },
      });
      pageReports.push(pageReport);
    }

    // 3. Mark the CrawlJob as done
    await tx.crawlJob.update({
      where: { id: jobId },
      data: { status: JobStatus.done },
    });

    return { ...siteReport, pages: pageReports };
  });
}

/**
 * High-level entry point called by the CHECK_QUEUE worker.
 *
 * Fetches all CheckerResults for the job from DB, builds report data in
 * memory, then persists everything. Returns the completed SiteReport.
 *
 * @param jobId      - The CrawlJob ID being aggregated
 * @param totalRoutesDiscovered - Passed in from the crawler (stored on the job)
 */
export async function aggregateJob(
  jobId: string,
  totalRoutesDiscovered: number,
): Promise<SiteReport & { pages: PageReport[] }> {
  // Load the job
  const job = await prisma.crawlJob.findUniqueOrThrow({ where: { id: jobId } });

  // Load all CheckerResults written for this job's pages
  // Use select to match exactly the ResultSlice shape — avoids unsafe cast
  // and ensures URL matching uses the same normalised URLs stored in Route.url
  const routes = await prisma.route.findMany({
    where: { jobId },
    select: { url: true },
  });
  const routeUrls: string[] = routes.map((r: { url: string }) => r.url);

  const rawResults = await prisma.checkerResult.findMany({
    where: { pageUrl: { in: routeUrls } },
    select: {
      id: true,
      clauseId: true,
      pageUrl: true,
      status: true,
      severity: true,
      evidence: true,
      checkedAt: true,
    },
  });

  // Load clause → section mapping from DB (populated by seed)
  const clauses = await prisma.clauseDefinition.findMany({
    select: { clauseId: true, section: true },
  });
  const clauseSectionMap = new Map<string, ClauseCategory>(
    clauses.map((c: { clauseId: string; section: ClauseCategory }) => [c.clauseId, c.section]),
  );

  // Build one PageReportData per unique URL
  const uniqueUrls = [...new Set<string>(rawResults.map((r) => r.pageUrl))];
  const pages = uniqueUrls.map((url) => buildPageReportData(url, rawResults));

  // Build site report data
  const siteData = buildSiteReportData(
    job,
    pages,
    rawResults,
    clauseSectionMap,
    totalRoutesDiscovered,
  );

  // Persist and return
  return persistSiteReport(jobId, siteData);
}
