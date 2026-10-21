/**
 * ClauseTable — clause-by-clause breakdown for a section.
 * Groups results by clauseId, shows status + evidence.
 */

import { useState } from "react";
import type { CheckerResultSummary, CheckStatus } from "./types.js";
import { StatusBadge } from "./StatusBadge.js";

interface ClauseGroup {
  clauseId: string;
  results: CheckerResultSummary[];
  worstStatus: CheckStatus;
}

function worstStatus(results: CheckerResultSummary[]): CheckStatus {
  if (results.some((r) => r.status === "fail")) return "fail";
  if (results.some((r) => r.status === "needs_review")) return "needs_review";
  if (results.some((r) => r.status === "pass")) return "pass";
  return "not_applicable";
}

function groupByClauses(results: CheckerResultSummary[]): ClauseGroup[] {
  const map = new Map<string, CheckerResultSummary[]>();
  for (const r of results) {
    const existing = map.get(r.clauseId) ?? [];
    existing.push(r);
    map.set(r.clauseId, existing);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clauseId, rs]) => ({ clauseId, results: rs, worstStatus: worstStatus(rs) }));
}

interface ClauseTableProps {
  results: CheckerResultSummary[];
  title: string;
}

export function ClauseTable({ results, title }: ClauseTableProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const groups = groupByClauses(results);

  function toggle(clauseId: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(clauseId)) {
        next.delete(clauseId);
      } else {
        next.add(clauseId);
      }
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <section aria-label={title}>
        <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No results for this section.</p>
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}
        aria-label={`${title} clause breakdown`}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb", textAlign: "left" }}>
            <th style={TH}>Clause</th>
            <th style={TH}>Status</th>
            <th style={TH}>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <>
              <tr
                key={group.clauseId}
                style={{ borderTop: "1px solid #e5e7eb", cursor: group.results.length > 1 ? "pointer" : "default" }}
                onClick={() => { if (group.results.length > 1) toggle(group.clauseId); }}
                aria-expanded={group.results.length > 1 ? expanded.has(group.clauseId) : undefined}
              >
                <td style={TD}>
                  <code style={{ fontSize: "0.8rem" }}>{group.clauseId}</code>
                  {group.results.length > 1 && (
                    <span style={{ marginLeft: "4px", color: "#9ca3af", fontSize: "0.75rem" }}>
                      {expanded.has(group.clauseId) ? "▲" : "▼"} {String(group.results.length)} sub-checks
                    </span>
                  )}
                </td>
                <td style={TD}><StatusBadge status={group.worstStatus} /></td>
                <td style={{ ...TD, color: "#374151" }}>
                  {group.results.length === 1
                    ? group.results[0]?.evidence ?? ""
                    : `${String(group.results.filter((r) => r.status === "pass").length)}/${String(group.results.length)} sub-checks pass`}
                </td>
              </tr>
              {group.results.length > 1 && expanded.has(group.clauseId) &&
                group.results.map((r, i) => (
                  <tr key={`${group.clauseId}-${String(i)}`} style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ ...TD, paddingLeft: "2rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                      └ sub-check {i + 1}
                    </td>
                    <td style={TD}><StatusBadge status={r.status} /></td>
                    <td style={{ ...TD, color: "#6b7280" }}>{r.evidence}</td>
                  </tr>
                ))
              }
            </>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const TH: React.CSSProperties = {
  padding: "8px 12px",
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const TD: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "top",
};
