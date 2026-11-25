/**
 * ReportPage — full site-wide compliance report.
 *
 * Fetches GET /reports/:id and renders:
 *   - Overall + per-section score cards
 *   - Per-page breakdown table
 *   - Drill-down into accessibility / cybersecurity / quality results per page
 *
 * This is the Phase 3 output — a real multi-page crawl report.
 */

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useParams } from "react-router-dom";

const API_URL = "http://localhost:3000";

// ── API response shapes ───────────────────────────────────────────────────────

interface CheckerResultApi {
  id: string;
  clauseId: string;
  pageUrl: string;
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  severity: "high" | "medium" | "low";
  evidence: string;
  checkedAt: string;
}

interface PageReportApi {
  id: string;
  pageUrl: string;
  score: number;
  passCount: number;
  failCount: number;
  needsReview: number;
  notApplicable: number;
  results: CheckerResultApi[];
}

interface SiteReportApi {
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
  pages: PageReportApi[];
}

const STATUS_ICON: Record<string, string> = {
  pass: "✓",
  fail: "✗",
  needs_review: "?",
  not_applicable: "–",
};
const STATUS_COLOR: Record<string, string> = {
  pass: "#2e7d32",
  fail: "#c62828",
  needs_review: "#f57c00",
  not_applicable: "#999",
};

// ── Main component ────────────────────────────────────────────────────────────

export function ReportPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SiteReportApi | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/reports/${id}`);
        if (!res.ok) {
          setError(`Report not found (HTTP ${String(res.status)})`);
          return;
        }
        const data = (await res.json()) as SiteReportApi;
        setReport(data);
      } catch (err) {
        setError(`Failed to load report: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div style={{ padding: "2rem", color: "#666" }}>Loading report…</div>;
  }

  if (error || !report) {
    return <div style={{ padding: "2rem", color: "#c62828" }}>{error || "Report not found."}</div>;
  }

  const crawlDuration = report.crawlFinishedAt
    ? Math.round(
        (new Date(report.crawlFinishedAt).getTime() - new Date(report.crawlStartedAt).getTime()) /
          1000,
      )
    : null;

  const totalResults = report.pages.reduce((s, p) => s + p.results.length, 0);
  const totalFails = report.pages.reduce((s, p) => s + p.failCount, 0);

  return (
    <div>
      {/* Header */}
      <h1 style={{ fontSize: "1.3rem", marginBottom: "0.3rem" }}>
        GIGW 3.0 Site Compliance Report
      </h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginTop: 0 }}>
        <strong>{report.siteUrl}</strong>
        {crawlDuration !== null && ` · crawled in ${String(crawlDuration)}s`}
        {` · ${String(report.totalRoutesChecked)} pages · ${String(totalResults)} checks · ${String(totalFails)} failures`}
      </p>

      {/* Score row */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          alignItems: "center",
        }}
      >
        <ScoreBadge label="Overall" score={report.overallScore} size="large" />
        <ScoreBadge label="Quality" score={report.scoreQuality} />
        <ScoreBadge label="Accessibility" score={report.scoreAccessibility} />
        <ScoreBadge label="Cybersecurity" score={report.scoreCybersecurity} />
        <ScoreBadge label="Lifecycle" score={report.scoreLifecycle} />

        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#666" }}>
          <div>Crawl started: {new Date(report.crawlStartedAt).toLocaleString()}</div>
          {report.crawlFinishedAt && (
            <div>Finished: {new Date(report.crawlFinishedAt).toLocaleString()}</div>
          )}
          <div>
            {String(report.totalRoutesDiscovered)} discovered · {String(report.totalRoutesChecked)}{" "}
            checked
          </div>
        </div>
      </div>

      {/* Per-page breakdown */}
      <h2 style={{ fontSize: "1.1rem" }}>Pages ({String(report.pages.length)})</h2>
      <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 60px 60px 60px 60px",
            padding: "0.5rem 0.75rem",
            background: "#fafafa",
            borderBottom: "2px solid #e0e0e0",
            fontSize: "0.8rem",
            fontWeight: "bold",
            color: "#666",
            textTransform: "uppercase",
          }}
        >
          <span>Page URL</span>
          <span style={{ textAlign: "center" }}>Score</span>
          <span style={{ textAlign: "center", color: "#2e7d32" }}>Pass</span>
          <span style={{ textAlign: "center", color: "#c62828" }}>Fail</span>
          <span style={{ textAlign: "center", color: "#f57c00" }}>Review</span>
          <span style={{ textAlign: "center", color: "#999" }}>N/A</span>
        </div>

        {/* Page rows */}
        {report.pages
          .slice()
          .sort((a, b) => a.score - b.score) // worst pages first
          .map((page) => {
            const isExpanded = expandedPage === page.id;
            const rowBg = page.failCount > 0 ? "#fff8f8" : "#fff";
            return (
              <div key={page.id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 60px 60px 60px 60px",
                    padding: "0.6rem 0.75rem",
                    borderBottom: "1px solid #f0f0f0",
                    background: rowBg,
                    cursor: "pointer",
                    alignItems: "center",
                  }}
                  onClick={() => {
                    setExpandedPage(isExpanded ? null : page.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedPage(isExpanded ? null : page.id);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={page.pageUrl}
                  >
                    {isExpanded ? "▼ " : "▶ "}
                    {page.pageUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <ScoreCell score={page.score} />
                  <span style={{ textAlign: "center", color: "#2e7d32" }}>
                    {String(page.passCount)}
                  </span>
                  <span
                    style={{
                      textAlign: "center",
                      color: page.failCount > 0 ? "#c62828" : "#999",
                      fontWeight: page.failCount > 0 ? "bold" : "normal",
                    }}
                  >
                    {String(page.failCount)}
                  </span>
                  <span style={{ textAlign: "center", color: "#f57c00" }}>
                    {String(page.needsReview)}
                  </span>
                  <span style={{ textAlign: "center", color: "#999" }}>
                    {String(page.notApplicable)}
                  </span>
                </div>

                {/* Expanded results */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#fafafa",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <PageResultsDetail results={page.results} />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({
  label,
  score,
  size = "normal",
}: {
  label: string;
  score: number | null;
  size?: "normal" | "large";
}): JSX.Element {
  const color =
    score === null ? "#bbb" : score >= 80 ? "#2e7d32" : score >= 50 ? "#f57c00" : "#c62828";
  const dim = size === "large" ? 80 : 60;
  const fs = size === "large" ? "1.3rem" : "0.95rem";

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: `${String(dim)}px`,
          height: `${String(dim)}px`,
          borderRadius: "50%",
          border: `5px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fs,
          fontWeight: "bold",
          color,
          margin: "0 auto",
        }}
        aria-label={`${label}: ${score === null ? "not evaluated" : String(Math.round(score)) + "%"}`}
      >
        {score === null ? "–" : `${String(Math.round(score))}%`}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.3rem" }}>{label}</div>
    </div>
  );
}

function ScoreCell({ score }: { score: number }): JSX.Element {
  const color = score >= 80 ? "#2e7d32" : score >= 50 ? "#f57c00" : "#c62828";
  return (
    <div
      style={{
        textAlign: "center",
        fontWeight: "bold",
        color,
        fontSize: "0.9rem",
      }}
    >
      {String(Math.round(score))}%
    </div>
  );
}

function PageResultsDetail({ results }: { results: CheckerResultApi[] }): JSX.Element {
  const sorted = [...results].sort((a, b) => {
    const order: Record<string, number> = {
      fail: 0,
      needs_review: 1,
      pass: 2,
      not_applicable: 3,
    };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  if (sorted.length === 0) {
    return <p style={{ color: "#999", fontSize: "0.85rem" }}>No checker results for this page.</p>;
  }

  return (
    <div style={{ fontSize: "0.82rem" }}>
      {sorted.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.3rem 0",
            borderBottom: "1px solid #efefef",
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: STATUS_COLOR[r.status], fontWeight: "bold", minWidth: "1rem" }}>
            {STATUS_ICON[r.status]}
          </span>
          <strong style={{ minWidth: "120px", color: "#444" }}>{r.clauseId}</strong>
          <span
            style={{
              padding: "0 0.3rem",
              borderRadius: "3px",
              fontSize: "0.7rem",
              background:
                r.severity === "high" ? "#c62828" : r.severity === "medium" ? "#f57c00" : "#888",
              color: "#fff",
              textTransform: "uppercase",
              alignSelf: "center",
              whiteSpace: "nowrap",
            }}
          >
            {r.severity}
          </span>
          <span style={{ color: "#555", flex: 1 }}>{r.evidence.slice(0, 120)}</span>
        </div>
      ))}
    </div>
  );
}
