/**
 * StatusBadge — coloured pill for pass/fail/needs_review/not_applicable.
 */

import type { CheckStatus } from "./types.js";

const BADGE_STYLES: Record<CheckStatus, { background: string; color: string; label: string }> = {
  pass: { background: "#dcfce7", color: "#15803d", label: "Pass" },
  fail: { background: "#fee2e2", color: "#b91c1c", label: "Fail" },
  needs_review: { background: "#fef9c3", color: "#92400e", label: "Review" },
  not_applicable: { background: "#f3f4f6", color: "#6b7280", label: "N/A" },
};

interface StatusBadgeProps {
  status: CheckStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const style = BADGE_STYLES[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        background: style.background,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
