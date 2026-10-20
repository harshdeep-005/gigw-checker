/**
 * CybersecurityReport — full cybersecurity results view.
 * Mirrors AccessibilityReport pattern.
 */

import { useState, useMemo } from "react";
import type { JSX } from "react";
import { CybersecurityScoreCard, type CybersecurityScoreData } from "./CybersecurityScoreCard.js";

export interface CyberClauseResult {
  clauseId: string;
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  severity: "high" | "medium" | "low";
  evidence: string;
  detail?: unknown;
}

type StatusFilter = "all" | "fail" | "needs_review" | "pass" | "not_applicable";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fail", label: "Failures" },
  { value: "needs_review", label: "Needs review" },
  { value: "pass", label: "Pass" },
  { value: "not_applicable", label: "N/A" },
];

const MANUAL_ONLY_CLAUSES: { clauseId: string; title: string }[] = [
  { clauseId: "5.3.1", title: "Security Audit Clearance certificate (NIC/STQC/CERT-In)" },
  { clauseId: "5.3.1-code-mfa", title: "MFA / password policy on login" },
  { clauseId: "5.3.2", title: "Hosting environment secured (CIA)" },
  {
    clauseId: "5.3.1-code-*",
    title: "Internal server/code config (directory traversal, RBAC, etc.)",
  },
  { clauseId: "5.3.1-db-*", title: "Database security (all items)" },
  { clauseId: "5.3.2-hosting", title: "Hosting location, DR drills, container security" },
];

const STATUS_CONFIG = {
  pass: { icon: "✓", color: "#2e7d32" },
  fail: { icon: "✗", color: "#c62828" },
  needs_review: { icon: "?", color: "#f57c00" },
  not_applicable: { icon: "–", color: "#999" },
} as const;

export function CybersecurityReport({
  results,
  score,
}: {
  results: CyberClauseResult[];
  score: number | null;
}): JSX.Element {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const scoreData = useMemo<CybersecurityScoreData>(() => {
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

  const filteredResults = useMemo(() => {
    if (filter === "all") return results;
    return results.filter((r) => r.status === filter);
  }, [results, filter]);

  const sortedResults = useMemo(() => {
    const order = { fail: 0, needs_review: 1, pass: 2, not_applicable: 3 };
    return [...filteredResults].sort((a, b) => order[a.status] - order[b.status]);
  }, [filteredResults]);

  return (
    <div>
      <CybersecurityScoreCard data={scoreData} />

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
            <div
              key={`${result.clauseId}-${String(i)}`}
              style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span
                  style={{
                    color: STATUS_CONFIG[result.status].color,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    minWidth: "1.5rem",
                  }}
                >
                  {STATUS_CONFIG[result.status].icon}
                </span>
                <div style={{ minWidth: "180px" }}>
                  <strong>{result.clauseId}</strong>
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "3px",
                      fontSize: "0.75rem",
                      background:
                        result.severity === "high"
                          ? "#c62828"
                          : result.severity === "medium"
                            ? "#f57c00"
                            : "#666",
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {result.severity}
                  </span>
                </div>
                <div style={{ flex: 1, fontSize: "0.9rem" }}>{result.evidence}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          border: "1px dashed #999",
          borderRadius: "8px",
          padding: "1rem 1.5rem",
          background: "#fffde7",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#f57f17" }}>
          Manual audit required — {String(MANUAL_ONLY_CLAUSES.length)} clause groups
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          These clauses require an authorized CERT-In/STQC security audit. This tool cannot verify
          them — they involve internal server configuration, database security, and hosting
          infrastructure that are not externally observable.
        </p>
        <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>
              <th style={{ padding: "0.4rem" }}>Clause</th>
              <th style={{ padding: "0.4rem" }}>Description</th>
              <th style={{ padding: "0.4rem" }}>Audited?</th>
            </tr>
          </thead>
          <tbody>
            {MANUAL_ONLY_CLAUSES.map((c) => (
              <tr key={c.clauseId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.4rem" }}>
                  <strong>{c.clauseId}</strong>
                </td>
                <td style={{ padding: "0.4rem" }}>{c.title}</td>
                <td style={{ padding: "0.4rem" }}>
                  <input type="checkbox" aria-label={`Audited ${c.clauseId}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
