/**
 * Integration tests for persistSiteReport and aggregateJob.
 *
 * Requires a live PostgreSQL + Redis stack.
 * Run `docker compose up -d` from the repo root first, then:
 *   npm run db:migrate --workspace=@gigw/db
 *   npm run db:seed    --workspace=@gigw/db
 *
 * These tests are SKIPPED automatically when DATABASE_URL is not set,
 * so they are safe to include in CI — the CI pipeline can opt-in by
 * providing the env var.
 *
 * Owner: Member B (B-003 / B-011).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, JobStatus, ClauseCategory } from "@gigw/db";
import {
  persistSiteReport,
  aggregateJob,
  buildPageReportData,
  buildSiteReportData,
} from "./aggregation.js";
import type { ResultSlice } from "./aggregation.js";

// ── Guard — skip everything when no DB is available ─────────────────────────

const DB_AVAILABLE = Boolean(process.env["DATABASE_URL"]);

const describeIfDb = DB_AVAILABLE ? describe : describe.skip;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal CrawlJob row and return its id. */
async function createJob(seedUrl: string): Promise<string> {
  const job = await prisma.crawlJob.create({
    data: { seedUrl, status: JobStatus.queued },
  });
  return job.id;
}

/** Create a Route row for a job. */
async function createRoute(jobId: string, url: string): Promise<void> {
  await prisma.route.create({
    data: { url, depth: 0, jobId, status: "crawled" },
  });
}

/** Create a CheckerResult row and return its id. */
async function createCheckerResult(
  clauseId: string,
  pageUrl: string,
): Promise<string> {
  const result = await prisma.checkerResult.create({
    data: {
      clauseId,
      pageUrl,
      status: "pass",
      severity: "medium",
      evidence: "integration test fixture",
      checkedAt: new Date(),
    },
  });
  return result.id;
}

// ── persistSiteReport ────────────────────────────────────────────────────────

describeIfDb("persistSiteReport (DB)", () => {
  let jobId: string;
  const PAGE_URL = "https://test.gov.in/";

  beforeAll(async () => {
    jobId = await createJob("https://test.gov.in");
    await createRoute(jobId, PAGE_URL);
  });

  afterAll(async () => {
    // Clean up in FK-safe order
    await prisma.checkerResult.deleteMany({ where: { pageUrl: PAGE_URL } });
    await prisma.pageReport.deleteMany({ where: { siteReport: { jobId } } });
    await prisma.siteReport.deleteMany({ where: { jobId } });
    await prisma.route.deleteMany({ where: { jobId } });
    await prisma.crawlJob.deleteMany({ where: { id: jobId } });
    await prisma.$disconnect();
  });

  it("creates a SiteReport row with correct top-level fields", async () => {
    const resultId = await createCheckerResult("5.1.1", PAGE_URL);

    const pageResults: ResultSlice[] = [
      {
        id: resultId,
        clauseId: "5.1.1",
        pageUrl: PAGE_URL,
        status: "pass",
        severity: "medium",
        evidence: "integration test fixture",
        checkedAt: new Date(),
      },
    ];

    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
    ]);

    const page = buildPageReportData(PAGE_URL, pageResults);
    const siteData = buildSiteReportData(
      { seedUrl: "https://test.gov.in", createdAt: new Date() },
      [page],
      pageResults,
      clauseMap,
      1,
    );

    const report = await persistSiteReport(jobId, siteData);

    // SiteReport fields
    expect(report.siteUrl).toBe("https://test.gov.in");
    expect(report.totalRoutesDiscovered).toBe(1);
    expect(report.totalRoutesChecked).toBe(1);
    expect(report.overallScore).toBe(100);
    expect(report.scoreQuality).toBe(100);
    expect(typeof report.id).toBe("string");
    expect(report.id.length).toBeGreaterThan(0);
  });

  it("creates PageReport rows and links them to the SiteReport", async () => {
    // Fetch what was just written
    const siteReport = await prisma.siteReport.findUniqueOrThrow({
      where: { jobId },
      include: { pages: true },
    });

    expect(siteReport.pages).toHaveLength(1);
    expect(siteReport.pages[0]?.pageUrl).toBe(PAGE_URL);
    expect(siteReport.pages[0]?.score).toBe(100);
    expect(siteReport.pages[0]?.passCount).toBe(1);
    expect(siteReport.pages[0]?.failCount).toBe(0);
  });

  it("connects CheckerResult rows to their PageReport", async () => {
    const pageReport = await prisma.pageReport.findFirstOrThrow({
      where: { siteReport: { jobId } },
      include: { results: true },
    });

    expect(pageReport.results.length).toBeGreaterThan(0);
    expect(pageReport.results[0]?.clauseId).toBe("5.1.1");
  });

  it("transitions CrawlJob status to done", async () => {
    const job = await prisma.crawlJob.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe(JobStatus.done);
  });
});

// ── aggregateJob ─────────────────────────────────────────────────────────────

describeIfDb("aggregateJob (DB)", () => {
  let jobId: string;
  const PAGE_URL = "https://aggregatetest.gov.in/";

  beforeAll(async () => {
    jobId = await createJob("https://aggregatetest.gov.in");
    await createRoute(jobId, PAGE_URL);
    // Seed a CheckerResult — clause 5.1.1 must exist in clause_definitions (from db:seed)
    await createCheckerResult("5.1.1", PAGE_URL);
  });

  afterAll(async () => {
    await prisma.checkerResult.deleteMany({ where: { pageUrl: PAGE_URL } });
    await prisma.pageReport.deleteMany({ where: { siteReport: { jobId } } });
    await prisma.siteReport.deleteMany({ where: { jobId } });
    await prisma.route.deleteMany({ where: { jobId } });
    await prisma.crawlJob.deleteMany({ where: { id: jobId } });
    await prisma.$disconnect();
  });

  it("returns a SiteReport with pages for all discovered routes", async () => {
    const report = await aggregateJob(jobId, 1);

    expect(report.siteUrl).toBe("https://aggregatetest.gov.in");
    expect(report.totalRoutesDiscovered).toBe(1);
    expect(report.pages).toHaveLength(1);
    expect(report.pages[0]?.pageUrl).toBe(PAGE_URL);
  });

  it("sets CrawlJob status to done", async () => {
    const job = await prisma.crawlJob.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe(JobStatus.done);
  });

  it("score is 100 when all checker results are pass", async () => {
    const report = await prisma.siteReport.findUniqueOrThrow({
      where: { jobId },
    });
    expect(report.overallScore).toBe(100);
  });
});
