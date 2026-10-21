/**
 * ManualReviewList — clearly separated checklist for needs_review results.
 * requirements.md §1.5: never mix these with automated pass/fail.
 */

import type { CheckerResultSummary } from "./types.js";

interface ManualReviewListProps {
  items: CheckerResultSummary[];
}

export function ManualReviewList({ items }: ManualReviewListProps): React.JSX.Element {
  if (items.length === 0) return <></>;

  return (
    <section
      aria-label="Manual review checklist"
      style={{
        marginTop: "2rem",
        padding: "1rem",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem", color: "#92400e" }}>
        ⚠ Manual Review Required ({items.length} item{items.length !== 1 ? "s" : ""})
      </h3>
      <p style={{ fontSize: "0.8rem", color: "#78350f", marginBottom: "1rem" }}>
        These results require human verification — they cannot be determined automatically.
        They are <strong>not included</strong> in the automated score.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, i) => (
          <li
            key={`${item.clauseId}-${String(i)}`}
            style={{
              display: "flex",
              gap: "12px",
              padding: "8px",
              background: "#fefce8",
              borderRadius: "4px",
              border: "1px solid #fef08a",
              fontSize: "0.875rem",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                padding: "2px 6px",
                background: "#fef9c3",
                color: "#92400e",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "monospace",
                alignSelf: "flex-start",
              }}
            >
              {item.clauseId}
            </span>
            <div>
              <div style={{ color: "#1f2937" }}>{item.evidence}</div>
              <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "2px" }}>
                {item.pageUrl}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
