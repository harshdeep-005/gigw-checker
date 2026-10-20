/**
 * Unit tests for buildPageReportData, computeSectionScores, buildSiteReportData.
 * DB-layer (persistSiteReport, aggregateJob) requires a live DB — not tested here.
 * Owner: Member B (B-011).
 */

import { describe, it, expect } from "vitest";
import { buildPageReportData, computeSectionScores, buildSiteReportData } from "./aggregation.js";
import { ClauseCategory } from "@gigw/db";
import type { ResultSlice } from "./aggregation.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(
  overrides: Partial<ResultSlice> & {
    status: ResultSlice["status"];
    severity: ResultSlice["severity"];
  },
): ResultSlice {
  return {
    id: "r1",
    clauseId: "5.1.1",
    pageUrl: "https://example.gov.in/",
    evidence: "",
    checkedAt: new Date(),
    ...overrides,
  };
}

const PAGE_URL = "https://example.gov.in/";

// ── buildPageReportData ───────────────────────────────────────────────────────

describe("buildPageReportData", () => {
  it("returns score 100 and all zeros when no results for page", () => {
    const report = buildPageReportData(PAGE_URL, []);
    expect(report.score).toBe(100);
    expect(report.passCount).toBe(0);
    expect(report.failCount).toBe(0);
    expect(report.needsReview).toBe(0);
    expect(report.notApplicable).toBe(0);
    expect(report.results).toHaveLength(0);
  });

  it("counts pass, fail, needsReview, notApplicable correctly", () => {
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", status: "fail", severity: "medium" }),
      makeResult({ id: "r3", status: "needs_review", severity: "low" }),
      makeResult({ id: "r4", status: "not_applicable", severity: "low" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.passCount).toBe(1);
    expect(report.failCount).toBe(1);
    expect(report.needsReview).toBe(1);
    expect(report.notApplicable).toBe(1);
    expect(report.results).toHaveLength(4);
  });

  it("only includes results matching the given pageUrl", () => {
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high", pageUrl: PAGE_URL }),
      makeResult({
        id: "r2",
        status: "fail",
        severity: "high",
        pageUrl: "https://example.gov.in/other",
      }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.passCount).toBe(1);
    expect(report.failCount).toBe(0);
    expect(report.results).toHaveLength(1);
  });

  it("computes score as 100 for all-pass results", () => {
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", status: "pass", severity: "medium" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(100);
  });

  it("computes score as 0 for all-fail results", () => {
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "fail", severity: "high" }),
      makeResult({ id: "r2", status: "fail", severity: "low" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(0);
  });

  it("excludes needs_review and not_applicable from score denominator", () => {
    // 1 high pass (weight 3), rest excluded → 3/3 = 100
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", status: "needs_review", severity: "high" }),
      makeResult({ id: "r3", status: "not_applicable", severity: "medium" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(100);
  });

  it("computes correct weighted score: 1 high fail + 1 low pass = 25", () => {
    // high fail weight=3, low pass weight=1 → passed=1, total=4 → 25
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "fail", severity: "high" }),
      makeResult({ id: "r2", status: "pass", severity: "low" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(25);
  });

  it("computes correct weighted score: 1 medium pass + 1 medium fail = 50", () => {
    // medium=2, passed=2, total=4 → 50
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "medium" }),
      makeResult({ id: "r2", status: "fail", severity: "medium" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(50);
  });

  it("computes correct weighted score: 2 high pass + 1 low fail = 86", () => {
    // passed=3+3=6, total=3+3+1=7 → round(6/7*100)=86
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", status: "pass", severity: "high" }),
      makeResult({ id: "r3", status: "fail", severity: "low" }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(86);
  });

  it("single pass result scores 100", () => {
    const results: ResultSlice[] = [makeResult({ id: "r1", status: "pass", severity: "medium" })];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(100);
    expect(report.passCount).toBe(1);
    expect(report.failCount).toBe(0);
  });

  it("single fail result scores 0", () => {
    const results: ResultSlice[] = [makeResult({ id: "r1", status: "fail", severity: "low" })];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.score).toBe(0);
    expect(report.failCount).toBe(1);
    expect(report.passCount).toBe(0);
  });

  it("pageUrl on each returned result matches the filter url", () => {
    const results: ResultSlice[] = [
      makeResult({ id: "r1", status: "pass", severity: "high", pageUrl: PAGE_URL }),
      makeResult({
        id: "r2",
        status: "fail",
        severity: "high",
        pageUrl: "https://example.gov.in/other",
      }),
    ];
    const report = buildPageReportData(PAGE_URL, results);
    expect(report.results.every((r) => r.pageUrl === PAGE_URL)).toBe(true);
  });
});

// ── computeSectionScores ─────────────────────────────────────────────────────

describe("computeSectionScores", () => {
  it("returns null for all sections when no results (not evaluated)", () => {
    const scores = computeSectionScores([], new Map());
    expect(scores.quality).toBeNull();
    expect(scores.accessibility).toBeNull();
    expect(scores.cybersecurity).toBeNull();
    expect(scores.lifecycle).toBeNull();
  });

  it("routes results to correct section buckets", () => {
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.2.1", ClauseCategory.accessibility],
      ["5.3.1", ClauseCategory.cybersecurity],
      ["5.4.1", ClauseCategory.lifecycle],
    ]);

    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "fail", severity: "high" }), // quality fails
      makeResult({ id: "r2", clauseId: "5.2.1", status: "pass", severity: "high" }), // accessibility passes
      makeResult({ id: "r3", clauseId: "5.3.1", status: "pass", severity: "medium" }), // cyber passes
      makeResult({ id: "r4", clauseId: "5.4.1", status: "pass", severity: "low" }), // lifecycle passes
    ];

    const scores = computeSectionScores(results, clauseMap);
    expect(scores.quality).toBe(0);
    expect(scores.accessibility).toBe(100);
    expect(scores.cybersecurity).toBe(100);
    expect(scores.lifecycle).toBe(100);
  });

  it("ignores results with unknown clauseId", () => {
    const clauseMap = new Map<string, ClauseCategory>([["5.1.1", ClauseCategory.quality]]);
    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "unknown", status: "fail", severity: "high" }),
    ];
    const scores = computeSectionScores(results, clauseMap);
    // Unknown clause ignored → quality has no applicable results → null (not evaluated)
    expect(scores.quality).toBeNull();
  });

  it("scores a section with mixed pass/fail using weights correctly", () => {
    // quality: 1 high pass (3) + 1 low fail (1) → passed=3, total=4 → 75
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.1.2", ClauseCategory.quality],
    ]);
    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", clauseId: "5.1.2", status: "fail", severity: "low" }),
    ];
    const scores = computeSectionScores(results, clauseMap);
    expect(scores.quality).toBe(75);
    // other sections have no results → null (not evaluated)
    expect(scores.accessibility).toBeNull();
    expect(scores.cybersecurity).toBeNull();
    expect(scores.lifecycle).toBeNull();
  });

  it("scores multiple sections independently", () => {
    // quality all-pass, lifecycle all-fail
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.4.1", ClauseCategory.lifecycle],
    ]);
    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "pass", severity: "medium" }),
      makeResult({ id: "r2", clauseId: "5.4.1", status: "fail", severity: "medium" }),
    ];
    const scores = computeSectionScores(results, clauseMap);
    expect(scores.quality).toBe(100);
    expect(scores.lifecycle).toBe(0);
    expect(scores.accessibility).toBeNull();
    expect(scores.cybersecurity).toBeNull();
  });

  it("excludes needs_review and not_applicable from section score denominator", () => {
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.1.2", ClauseCategory.quality],
    ]);
    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", clauseId: "5.1.2", status: "not_applicable", severity: "high" }),
    ];
    const scores = computeSectionScores(results, clauseMap);
    // not_applicable excluded → only 1 high pass → 3/3 → 100
    expect(scores.quality).toBe(100);
  });

  it("handles all four sections having results simultaneously", () => {
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.2.1", ClauseCategory.accessibility],
      ["5.3.1", ClauseCategory.cybersecurity],
      ["5.4.1", ClauseCategory.lifecycle],
    ]);
    // all fail → each section should score 0
    const results: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "fail", severity: "low" }),
      makeResult({ id: "r2", clauseId: "5.2.1", status: "fail", severity: "low" }),
      makeResult({ id: "r3", clauseId: "5.3.1", status: "fail", severity: "low" }),
      makeResult({ id: "r4", clauseId: "5.4.1", status: "fail", severity: "low" }),
    ];
    const scores = computeSectionScores(results, clauseMap);
    expect(scores.quality).toBe(0);
    expect(scores.accessibility).toBe(0);
    expect(scores.cybersecurity).toBe(0);
    expect(scores.lifecycle).toBe(0);
  });
});

// ── buildSiteReportData ──────────────────────────────────────────────────────

describe("buildSiteReportData", () => {
  const mockJob = {
    seedUrl: "https://example.gov.in",
    createdAt: new Date("2026-09-16T10:00:00Z"),
  };

  it("returns overallScore 100 when pages is empty", () => {
    const data = buildSiteReportData(mockJob, [], [], new Map(), 0);
    expect(data.overallScore).toBe(100);
    expect(data.totalRoutesChecked).toBe(0);
  });

  it("averages page scores for overallScore", () => {
    const page1 = buildPageReportData(PAGE_URL, [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
    ]);
    const page2 = buildPageReportData("https://example.gov.in/about", [
      makeResult({
        id: "r2",
        status: "fail",
        severity: "high",
        pageUrl: "https://example.gov.in/about",
      }),
    ]);
    // page1 = 100, page2 = 0 → average = 50
    const data = buildSiteReportData(mockJob, [page1, page2], [], new Map(), 10);
    expect(data.overallScore).toBe(50);
    expect(data.totalRoutesChecked).toBe(2);
    expect(data.totalRoutesDiscovered).toBe(10);
  });

  it("sets siteUrl and crawlStartedAt from job", () => {
    const data = buildSiteReportData(mockJob, [], [], new Map(), 0);
    expect(data.siteUrl).toBe("https://example.gov.in");
    expect(data.crawlStartedAt).toEqual(mockJob.createdAt);
  });

  it("sets crawlFinishedAt to approximately now", () => {
    const before = new Date();
    const data = buildSiteReportData(mockJob, [], [], new Map(), 0);
    const after = new Date();
    expect(data.crawlFinishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(data.crawlFinishedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("rounds overallScore correctly for 3 pages: 100+100+0 = 67", () => {
    const pages = [
      buildPageReportData(PAGE_URL, [makeResult({ id: "r1", status: "pass", severity: "high" })]),
      buildPageReportData("https://example.gov.in/a", [
        makeResult({
          id: "r2",
          status: "pass",
          severity: "high",
          pageUrl: "https://example.gov.in/a",
        }),
      ]),
      buildPageReportData("https://example.gov.in/b", [
        makeResult({
          id: "r3",
          status: "fail",
          severity: "high",
          pageUrl: "https://example.gov.in/b",
        }),
      ]),
    ];
    // (100 + 100 + 0) / 3 = 66.67 → rounds to 67
    const data = buildSiteReportData(mockJob, pages, [], new Map(), 10);
    expect(data.overallScore).toBe(67);
  });

  it("rounds overallScore correctly for 3 pages: 100+50+0 = 50", () => {
    const pages = [
      buildPageReportData(PAGE_URL, [makeResult({ id: "r1", status: "pass", severity: "high" })]),
      buildPageReportData("https://example.gov.in/a", [
        makeResult({
          id: "r2",
          status: "pass",
          severity: "medium",
          pageUrl: "https://example.gov.in/a",
        }),
        makeResult({
          id: "r3",
          status: "fail",
          severity: "medium",
          pageUrl: "https://example.gov.in/a",
        }),
      ]),
      buildPageReportData("https://example.gov.in/b", [
        makeResult({
          id: "r4",
          status: "fail",
          severity: "high",
          pageUrl: "https://example.gov.in/b",
        }),
      ]),
    ];
    // page scores: 100, 50, 0 → average = 50
    const data = buildSiteReportData(mockJob, pages, [], new Map(), 10);
    expect(data.overallScore).toBe(50);
  });

  it("wires section scores through from allResults", () => {
    const clauseMap = new Map<string, ClauseCategory>([
      ["5.1.1", ClauseCategory.quality],
      ["5.4.1", ClauseCategory.lifecycle],
    ]);
    const allResults: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "pass", severity: "high" }),
      makeResult({ id: "r2", clauseId: "5.4.1", status: "fail", severity: "high" }),
    ];
    const data = buildSiteReportData(mockJob, [], allResults, clauseMap, 5);
    expect(data.sectionScores.quality).toBe(100);
    expect(data.sectionScores.lifecycle).toBe(0);
    expect(data.sectionScores.accessibility).toBeNull();
    expect(data.sectionScores.cybersecurity).toBeNull();
  });

  it("section scores are independent of page scores", () => {
    // pages array is empty (overallScore=100), but allResults drive section scores
    const clauseMap = new Map<string, ClauseCategory>([["5.1.1", ClauseCategory.quality]]);
    const allResults: ResultSlice[] = [
      makeResult({ id: "r1", clauseId: "5.1.1", status: "fail", severity: "high" }),
    ];
    const data = buildSiteReportData(mockJob, [], allResults, clauseMap, 0);
    expect(data.overallScore).toBe(100); // no pages → 100
    expect(data.sectionScores.quality).toBe(0); // but quality section sees the fail
  });

  it("totalRoutesDiscovered and totalRoutesChecked are set correctly", () => {
    const pages = [
      buildPageReportData(PAGE_URL, [makeResult({ id: "r1", status: "pass", severity: "low" })]),
      buildPageReportData("https://example.gov.in/a", [
        makeResult({
          id: "r2",
          status: "pass",
          severity: "low",
          pageUrl: "https://example.gov.in/a",
        }),
      ]),
    ];
    const data = buildSiteReportData(mockJob, pages, [], new Map(), 42);
    expect(data.totalRoutesDiscovered).toBe(42);
    expect(data.totalRoutesChecked).toBe(2);
  });

  it("pages array is preserved in output", () => {
    const page = buildPageReportData(PAGE_URL, [
      makeResult({ id: "r1", status: "pass", severity: "high" }),
    ]);
    const data = buildSiteReportData(mockJob, [page], [], new Map(), 1);
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0]?.pageUrl).toBe(PAGE_URL);
  });
});
