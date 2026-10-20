/**
 * AccessibilityScoreCard — summary of accessibility compliance for a site.
 *
 * Shows the overall accessibility score, counts by status, and a visual
 * progress bar. Used at the top of the accessibility report page.
 */

import type { JSX } from "react";

export interface AccessibilityScoreData {
  score: number | null; // null = not evaluated
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  notApplicableCount: number;
  totalClauses: number;
}

export function AccessibilityScoreCard({ data }: { data: AccessibilityScoreData }): JSX.Element {
  const { score, passCount, failCount, needsReviewCount, notApplicableCount, totalClauses } = data;

  const scoreColor =
    score === null ? "#999" : score >= 80 ? "#2e7d32" : score >= 50 ? "#f57c00" : "#c62828";

  const scoreText = score === null ? "Not evaluated" : `${String(Math.round(score))}%`;

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        background: "#f5f5f5",
        marginBottom: "1.5rem",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Accessibility (§5.2 — WCAG 2.1 AA)</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        {/* Score circle */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: `8px solid ${scoreColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: scoreColor,
          }}
          aria-label={`Accessibility score: ${scoreText}`}
        >
          {scoreText}
        </div>

        {/* Counts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <CountRow icon="✓" color="#2e7d32" label="Pass" count={passCount} />
          <CountRow icon="✗" color="#c62828" label="Fail" count={failCount} />
          <CountRow icon="?" color="#f57c00" label="Needs review" count={needsReviewCount} />
          <CountRow icon="–" color="#999" label="Not applicable" count={notApplicableCount} />
        </div>

        <div style={{ marginLeft: "auto", color: "#666" }}>
          {String(totalClauses)} clauses checked
        </div>
      </div>
    </div>
  );
}

function CountRow({
  icon,
  color,
  label,
  count,
}: {
  icon: string;
  color: string;
  label: string;
  count: number;
}): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ color, fontWeight: "bold", width: "1.2rem" }}>{icon}</span>
      <span>{label}:</span>
      <strong>{String(count)}</strong>
    </div>
  );
}
