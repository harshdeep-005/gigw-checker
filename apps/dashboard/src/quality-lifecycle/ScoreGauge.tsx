/**
 * ScoreGauge — circular score display (0-100).
 * Colour: green ≥80, amber 50-79, red <50.
 */

interface ScoreGaugeProps {
  score: number | null;
  label: string;
  size?: number;
}

function scoreColour(score: number): string {
  if (score >= 80) return "#16a34a"; // green-600
  if (score >= 50) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

export function ScoreGauge({ score, label, size = 80 }: ScoreGaugeProps): React.JSX.Element {
  const display = score === null ? "—" : String(score);
  const colour = score === null ? "#9ca3af" : scoreColour(score);
  const r = (size / 2) * 0.78;
  const circumference = 2 * Math.PI * r;
  const filled = score === null ? 0 : (score / 100) * circumference;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
      aria-label={`${label}: ${display}${score !== null ? " out of 100" : ""}`}
    >
      <svg width={size} height={size} role="img" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={size * 0.1}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={size * 0.1}
          strokeDasharray={`${String(filled)} ${String(circumference - filled)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="bold"
          fill={colour}
        >
          {display}
        </text>
      </svg>
      <span style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center" }}>{label}</span>
    </div>
  );
}
