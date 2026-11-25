/**
 * QualityLifecyclePage — dashboard view for §5.1 (Quality) + §5.4 (Lifecycle).
 * Owner: Member B (B-009).
 *
 * Route: /reports/:reportId/quality
 *
 * Shows:
 *  - Section score gauges (Quality + Lifecycle)
 *  - Clause-by-clause breakdown tables (filtered by section)
 *  - Manual-review checklist (needs_review items, clearly separated)
 */

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { SiteReportSummary, CheckerResultSummary } from "./types.js";
import { ScoreGauge } from "./ScoreGauge.js";
import { ClauseTable } from "./ClauseTable.js";
import { ManualReviewList } from "./ManualReviewList.js";

// GIGW clause ID prefixes for each section owned by Member B
const QUALITY_PREFIX = "5.1.";
const LIFECYCLE_PREFIX = "5.4.";

function filterByPrefix(results: CheckerResultSummary[], prefix: string): CheckerResultSummary[] {
  return results.filter((r) => r.clauseId.startsWith(prefix));
}

export function QualityLifecyclePage(): React.JSX.Element {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<SiteReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId === undefined) return;

    setLoading(true);
    setError(null);

    fetch(`/api/reports/${reportId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API returned ${String(res.status)}`);
        return res.json() as Promise<SiteReportSummary>;
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load report");
        setLoading(false);
      });
  }, [reportId]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" style={{ padding: "2rem", color: "#6b7280" }}>
        Loading report…
      </div>
    );
  }

  if (error !== null || report === null) {
    return (
      <div role="alert" style={{ padding: "2rem", color: "#b91c1c" }}>
        {error ?? "Report not found."}
      </div>
    );
  }

  // Flatten all results across all pages
  const allResults = report.pages.flatMap((p) => p.results);

  const qualityResults = filterByPrefix(allResults, QUALITY_PREFIX);
  const lifecycleResults = filterByPrefix(allResults, LIFECYCLE_PREFIX);

  // Split: automated results (pass/fail) vs manual review (needs_review)
  const qualityAuto = qualityResults.filter((r) => r.status !== "needs_review");
  const lifecycleAuto = lifecycleResults.filter((r) => r.status !== "needs_review");
  const manualItems = allResults.filter(
    (r) =>
      r.status === "needs_review" &&
      (r.clauseId.startsWith(QUALITY_PREFIX) || r.clauseId.startsWith(LIFECYCLE_PREFIX)),
  );

  return (
    <article aria-label="Quality and Lifecycle compliance report">
      {/* ── Header ── */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Quality &amp; Lifecycle</h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "4px" }}>
          GIGW §5.1 (Quality) + §5.4 (Lifecycle) — {report.siteUrl}
        </p>
        <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "2px" }}>
          {report.totalRoutesChecked} page{report.totalRoutesChecked !== 1 ? "s" : ""} checked
          {report.crawlFinishedAt !== null
            ? ` · completed ${new Date(report.crawlFinishedAt).toLocaleString()}`
            : ""}
        </p>
      </header>

      {/* ── Score gauges ── */}
      <section
        aria-label="Section scores"
        style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}
      >
        <ScoreGauge score={report.scoreQuality} label="Quality §5.1" size={90} />
        <ScoreGauge score={report.scoreLifecycle} label="Lifecycle §5.4" size={90} />
        <ScoreGauge score={report.overallScore} label="Overall" size={90} />
      </section>

      {/* ── Stats bar ── */}
      <SectionStats results={[...qualityResults, ...lifecycleResults]} />

      {/* ── Clause tables ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1.5rem" }}>
        <ClauseTable results={qualityAuto} title="§5.1 Quality — Automated Results" />
        <ClauseTable results={lifecycleAuto} title="§5.4 Lifecycle — Automated Results" />
      </div>

      {/* ── Manual review ── */}
      <ManualReviewList items={manualItems} />
    </article>
  );
}

// ── Sub-component: stats bar ─────────────────────────────────────────────────

interface SectionStatsProps {
  results: CheckerResultSummary[];
}

function SectionStats({ results }: SectionStatsProps): React.JSX.Element {
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const review = results.filter((r) => r.status === "needs_review").length;
  const na = results.filter((r) => r.status === "not_applicable").length;

  // Named as a component but kept inline — rename to satisfy naming rule
  function StatItem({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }): React.JSX.Element {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{String(value)}</div>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{label}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        padding: "1rem",
        background: "#f9fafb",
        borderRadius: "8px",
        flexWrap: "wrap",
      }}
      aria-label="Result counts"
    >
      <StatItem label="Pass" value={pass} color="#16a34a" />
      <StatItem label="Fail" value={fail} color="#dc2626" />
      <StatItem label="Review" value={review} color="#d97706" />
      <StatItem label="N/A" value={na} color="#9ca3af" />
    </div>
  );
}
