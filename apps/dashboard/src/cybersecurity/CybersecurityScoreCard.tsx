/**
 * CybersecurityScoreCard — summary of cybersecurity compliance.
 * Mirrors AccessibilityScoreCard pattern.
 */

import type { JSX } from "react";

export interface CybersecurityScoreData {
  score: number | null;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  notApplicableCount: number;
  totalClauses: number;
}

export function CybersecurityScoreCard({ data }: { data: CybersecurityScoreData }): JSX.Element {
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
      <h2 style={{ marginTop: 0 }}>Cybersecurity (§5.3 — passive checks only)</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
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
          aria-label={`Cybersecurity score: ${scoreText}`}
        >
          {scoreText}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <Row icon="✓" color="#2e7d32" label="Pass" count={passCount} />
          <Row icon="✗" color="#c62828" label="Fail" count={failCount} />
          <Row icon="?" color="#f57c00" label="Needs review" count={needsReviewCount} />
          <Row icon="–" color="#999" label="Not applicable" count={notApplicableCount} />
        </div>
        <div style={{ marginLeft: "auto", color: "#666" }}>
          {String(totalClauses)} clauses checked
        </div>
      </div>
      <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.8rem" }}>
        ⚠️ This tool performs passive inspection only. It does not conduct active security scanning.
        Manual-only clauses require an authorized CERT-In/STQC security audit.
      </p>
    </div>
  );
}

function Row({
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
