/**
 * ClauseResultRow — single clause result in the accessibility report.
 *
 * Shows clause ID, status icon, severity badge, and evidence.
 * Expandable for drill-down on failures.
 */

import { useState } from "react";
import type { JSX } from "react";

export interface ClauseResultData {
  clauseId: string;
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  severity: "high" | "medium" | "low";
  evidence: string;
  detail?: unknown;
}

const STATUS_CONFIG = {
  pass: { icon: "✓", color: "#2e7d32", label: "Pass" },
  fail: { icon: "✗", color: "#c62828", label: "Fail" },
  needs_review: { icon: "?", color: "#f57c00", label: "Needs review" },
  not_applicable: { icon: "–", color: "#999", label: "N/A" },
} as const;

const SEVERITY_COLORS = {
  high: "#c62828",
  medium: "#f57c00",
  low: "#666",
} as const;

export function ClauseResultRow({ result }: { result: ClauseResultData }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[result.status];
  const sevColor = SEVERITY_COLORS[result.severity];
  const hasDetail = result.detail !== null && result.detail !== undefined;
  const canExpand = result.status === "fail" || result.status === "needs_review" || hasDetail;

  return (
    <div
      style={{
        borderBottom: "1px solid #eee",
        padding: "0.75rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          cursor: canExpand ? "pointer" : "default",
        }}
        onClick={() => {
          if (canExpand) setExpanded(!expanded);
        }}
        onKeyDown={(e) => {
          if (canExpand && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
      >
        {/* Status icon */}
        <span
          style={{
            color: config.color,
            fontWeight: "bold",
            fontSize: "1.1rem",
            minWidth: "1.5rem",
          }}
          aria-label={config.label}
        >
          {config.icon}
        </span>

        {/* Clause ID + severity */}
        <div style={{ minWidth: "180px" }}>
          <strong>{result.clauseId}</strong>
          <span
            style={{
              marginLeft: "0.5rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "3px",
              fontSize: "0.75rem",
              background: sevColor,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            {result.severity}
          </span>
        </div>

        {/* Evidence (truncated) */}
        <div
          style={{
            flex: 1,
            color: result.status === "pass" ? "#555" : "#333",
            fontSize: "0.9rem",
          }}
        >
          {expanded ? result.evidence : truncate(result.evidence, 100)}
        </div>

        {/* Expand indicator */}
        {canExpand && (
          <span style={{ color: "#999", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
        )}
      </div>

      {/* Detail panel */}
      {expanded && hasDetail && (
        <div
          style={{
            marginLeft: "2rem",
            marginTop: "0.5rem",
            padding: "0.5rem",
            background: "#f9f9f9",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#666",
          }}
        >
          <details>
            <summary style={{ cursor: "pointer" }}>Detail data</summary>
            <pre style={{ fontSize: "0.75rem", overflow: "auto" }}>
              {JSON.stringify(result.detail, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}
