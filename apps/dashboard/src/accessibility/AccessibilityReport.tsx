/**
 * AccessibilityReport — full accessibility results view for a site report.
 *
 * Shows the score card, filterable clause results list, and manual-only
 * clauses that require human review.
 *
 * Fetches data from the API (GET /reports/:id) and filters for §5.2
 * accessibility results.
 */

import { useState, useMemo } from "react";
import type { JSX } from "react";
import { AccessibilityScoreCard, type AccessibilityScoreData } from "./AccessibilityScoreCard.js";
import { ClauseResultRow, type ClauseResultData } from "./ClauseResultRow.js";

// ── Filter state ──────────────────────────────────────────────────────────────

type StatusFilter = "all" | "fail" | "needs_review" | "pass" | "not_applicable";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fail", label: "Failures" },
  { value: "needs_review", label: "Needs review" },
  { value: "pass", label: "Pass" },
  { value: "not_applicable", label: "N/A" },
];

// ── Manual-only §5.2 clauses (no automation — surfaced for human review) ─────

const MANUAL_ONLY_CLAUSES: { clauseId: string; title: string; wcag: string }[] = [
  { clauseId: "5.2.2", title: "Alternative for prerecorded audio/video-only", wcag: "1.2.1" },
  { clauseId: "5.2.4", title: "Audio description or text alternative for video", wcag: "1.2.3" },
  { clauseId: "5.2.5", title: "Captions for live audio", wcag: "1.2.4" },
  { clauseId: "5.2.6", title: "Audio description for prerecorded video", wcag: "1.2.5" },
  { clauseId: "5.2.9", title: "Sensory characteristics not sole instruction", wcag: "1.3.3" },
  { clauseId: "5.2.20", title: "Content on hover/focus dismissible/hoverable", wcag: "1.4.13" },
  { clauseId: "5.2.23", title: "Character key shortcuts remappable/off", wcag: "2.1.4" },
  { clauseId: "5.2.24", title: "Timing adjustable", wcag: "2.2.1" },
  { clauseId: "5.2.34", title: "Pointer gestures have single-pointer alternative", wcag: "2.5.1" },
  { clauseId: "5.2.35", title: "Pointer cancellation", wcag: "2.5.2" },
  { clauseId: "5.2.37", title: "Motion actuation has UI alternative", wcag: "2.5.4" },
  { clauseId: "5.2.40", title: "No context change on focus", wcag: "3.2.1" },
  { clauseId: "5.2.41", title: "No unexpected context change on input", wcag: "3.2.2" },
  { clauseId: "5.2.46", title: "Error correction suggestions", wcag: "3.3.3" },
  { clauseId: "5.2.47", title: "Error prevention for legal/financial/data actions", wcag: "3.3.4" },
];

export function AccessibilityReport({
  results,
  score,
}: {
  results: ClauseResultData[];
  score: number | null;
}): JSX.Element {
  const [filter, setFilter] = useState<StatusFilter>("all");

  // Compute counts for the score card
  const scoreData = useMemo<AccessibilityScoreData>(() => {
    const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
    for (const r of results) counts[r.status]++;
    return {
      score,
      passCount: counts.pass,
      failCount: counts.fail,
      needsReviewCount: counts.needs_review,
      notApplicableCount: counts.not_applicable,
      totalClauses: results.length,
    };
  }, [results, score]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (filter === "all") return results;
    return results.filter((r) => r.status === filter);
  }, [results, filter]);

  // Sort: fail first, then needs_review, then pass, then not_applicable
  const sortedResults = useMemo(() => {
    const order = { fail: 0, needs_review: 1, pass: 2, not_applicable: 3 };
    return [...filteredResults].sort((a, b) => order[a.status] - order[b.status]);
  }, [filteredResults]);

  return (
    <div>
      <AccessibilityScoreCard data={scoreData} />

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setFilter(opt.value);
            }}
            style={{
              padding: "0.3rem 0.8rem",
              border: filter === opt.value ? "2px solid #1976d2" : "1px solid #ccc",
              background: filter === opt.value ? "#e3f2fd" : "#fff",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
            aria-pressed={filter === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results list */}
      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "0 1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            fontWeight: "bold",
            padding: "0.75rem 0",
            borderBottom: "2px solid #e0e0e0",
            color: "#666",
            fontSize: "0.85rem",
            textTransform: "uppercase",
          }}
        >
          <span style={{ minWidth: "1.5rem" }}></span>
          <span style={{ minWidth: "180px" }}>Clause</span>
          <span>Evidence</span>
        </div>

        {sortedResults.length === 0 ? (
          <div style={{ padding: "1rem", color: "#999" }}>
            No results match the selected filter.
          </div>
        ) : (
          sortedResults.map((result, i) => (
            <ClauseResultRow key={`${result.clauseId}-${String(i)}`} result={result} />
          ))
        )}
      </div>

      {/* Manual-only clauses checklist */}
      <ManualReviewSection />
    </div>
  );
}

function ManualReviewSection(): JSX.Element {
  return (
    <div
      style={{
        border: "1px dashed #999",
        borderRadius: "8px",
        padding: "1rem 1.5rem",
        background: "#fffde7",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#f57f17" }}>
        Manual review required — {String(MANUAL_ONLY_CLAUSES.length)} clauses
      </h3>
      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        These clauses cannot be checked automatically. They require human verification by a reviewer
        using assistive technology.
      </p>
      <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
            <th style={{ padding: "0.4rem" }}>Clause</th>
            <th style={{ padding: "0.4rem" }}>WCAG</th>
            <th style={{ padding: "0.4rem" }}>Description</th>
            <th style={{ padding: "0.4rem" }}>Reviewed?</th>
          </tr>
        </thead>
        <tbody>
          {MANUAL_ONLY_CLAUSES.map((c) => (
            <tr key={c.clauseId} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.4rem" }}>
                <strong>{c.clauseId}</strong>
              </td>
              <td style={{ padding: "0.4rem", color: "#999" }}>{c.wcag}</td>
              <td style={{ padding: "0.4rem" }}>{c.title}</td>
              <td style={{ padding: "0.4rem" }}>
                <input type="checkbox" aria-label={`Reviewed ${c.clauseId}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
