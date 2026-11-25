import { useState } from "react";
import type { JSX } from "react";
import { AccessibilityReport } from "../accessibility/AccessibilityReport.js";
import type { ClauseResultData } from "../accessibility/ClauseResultRow.js";
import { CybersecurityReport } from "../cybersecurity/CybersecurityReport.js";
import type { CyberClauseResult } from "../cybersecurity/CybersecurityReport.js";

/**
 * HomePage — URL submission + connected real-data report.
 *
 * Flow: user enters URL → POST /check → all 39 checkers run →
 * results displayed in 4 connected tabs (Summary, Quality, Accessibility, Cybersecurity)
 * with real data from the check.
 */

const API_URL = "http://localhost:3000";
const ALLOWED_DOMAIN_RE = /(\.|^)(gov\.in|nic\.in|ac\.in|res\.in|edu\.in)(:\d+)?$/i;

interface CheckResult {
  clauseId: string;
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  severity: "high" | "medium" | "low";
  evidence: string;
  detail?: unknown;
  pageUrl: string;
  checkedAt: string;
}

interface CheckResponse {
  url: string;
  title: string;
  results: CheckResult[];
  timing: number;
}

type ActiveTab = "summary" | "quality" | "accessibility" | "cybersecurity";

// ── Score helpers ─────────────────────────────────────────────────────────────

function computeScore(
  results: CheckResult[] | ClauseResultData[] | CyberClauseResult[],
): number | null {
  if (results.length === 0) return null;
  const applicable = results.filter((r) => r.status !== "not_applicable");
  if (applicable.length === 0) return null;
  const passed = applicable.filter((r) => r.status === "pass").length;
  return Math.round((passed / applicable.length) * 100);
}

function scoreColor(score: number | null): string {
  if (score === null) return "#999";
  if (score >= 80) return "#2e7d32";
  if (score >= 50) return "#f57c00";
  return "#c62828";
}

// ── ScoreBadge ────────────────────────────────────────────────────────────────

function ScoreBadge({
  label,
  score,
  size = "normal",
}: {
  label: string;
  score: number | null;
  size?: "normal" | "large";
}): JSX.Element {
  const color = scoreColor(score);
  const dim = size === "large" ? 80 : 60;
  const fs = size === "large" ? "1.3rem" : "1rem";
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: `${String(dim)}px`,
          height: `${String(dim)}px`,
          borderRadius: "50%",
          border: `5px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fs,
          fontWeight: "bold",
          color,
          margin: "0 auto",
        }}
        aria-label={`${label}: ${score === null ? "not evaluated" : String(score) + "%"}`}
      >
        {score === null ? "–" : `${String(score)}%`}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.3rem" }}>{label}</div>
    </div>
  );
}

// ── ResultRow (shared for quality section) ────────────────────────────────────

function ResultRow({ r, i, total }: { r: CheckResult; i: number; total: number }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const STATUS_ICON: Record<string, string> = {
    pass: "✓",
    fail: "✗",
    needs_review: "?",
    not_applicable: "–",
  };
  const STATUS_COLOR: Record<string, string> = {
    pass: "#2e7d32",
    fail: "#c62828",
    needs_review: "#f57c00",
    not_applicable: "#999",
  };
  const SEV_COLOR: Record<string, string> = { high: "#c62828", medium: "#f57c00", low: "#666" };
  const canExpand = r.status === "fail" || r.status === "needs_review";

  return (
    <div style={{ borderBottom: i < total - 1 ? "1px solid #eee" : "none" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.65rem 0.75rem",
          alignItems: "flex-start",
          cursor: canExpand ? "pointer" : "default",
          background: r.status === "fail" ? "#fff8f8" : "transparent",
        }}
        onClick={() => {
          if (canExpand) setExpanded(!expanded);
        }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        onKeyDown={(e) => {
          if (canExpand && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <span style={{ color: STATUS_COLOR[r.status], fontWeight: "bold", minWidth: "1.2rem" }}>
          {STATUS_ICON[r.status]}
        </span>
        <span style={{ minWidth: "90px", fontWeight: "600", fontSize: "0.85rem" }}>
          {r.clauseId}
        </span>
        <span
          style={{
            padding: "0.1rem 0.35rem",
            borderRadius: "3px",
            fontSize: "0.7rem",
            background: SEV_COLOR[r.severity],
            color: "#fff",
            textTransform: "uppercase",
            alignSelf: "center",
            whiteSpace: "nowrap",
          }}
        >
          {r.severity}
        </span>
        <span style={{ flex: 1, fontSize: "0.88rem", color: "#444" }}>
          {expanded ? r.evidence : r.evidence.slice(0, 110) + (r.evidence.length > 110 ? "…" : "")}
        </span>
        {canExpand && (
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>{expanded ? "▲" : "▼"}</span>
        )}
      </div>
      {expanded && r.detail && (
        <div
          style={{
            padding: "0.4rem 0.75rem 0.6rem 2.5rem",
            background: "#f9f9f9",
            fontSize: "0.78rem",
            color: "#666",
          }}
        >
          <details open>
            <summary style={{ cursor: "pointer" }}>Detail</summary>
            <pre style={{ overflow: "auto", margin: "0.3rem 0 0" }}>
              {JSON.stringify(r.detail, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ── QualityTab ────────────────────────────────────────────────────────────────

const QUALITY_MANUAL = [
  { clauseId: "5.1.3", title: "Source cited for reproduced documents" },
  { clauseId: "5.1.4", title: "Due permission for copyrighted content" },
  { clauseId: "5.1.13", title: "Multi-browser tested; regional fonts render correctly" },
  { clauseId: "5.1.23", title: "Consistent UX/visual identity across organisation" },
];

const LIFECYCLE_MANUAL = [{ clauseId: "5.4.2", title: "Website URL on organisational stationery" }];

function QualityTab({ qlResults }: { qlResults: CheckResult[] }): JSX.Element {
  const [filter, setFilter] = useState<"all" | "fail" | "needs_review" | "pass">("all");
  const filtered = filter === "all" ? qlResults : qlResults.filter((r) => r.status === filter);
  const order: Record<string, number> = { fail: 0, needs_review: 1, pass: 2, not_applicable: 3 };
  const sorted = [...filtered].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
  const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
  for (const r of qlResults) counts[r.status]++;

  return (
    <div>
      {/* Score card */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          background: "#f5f5f5",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Quality + Lifecycle (§5.1 + §5.4)</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <ScoreBadge label="Quality" score={computeScore(qlResults)} size="large" />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.9rem" }}
          >
            <span style={{ color: "#2e7d32" }}>✓ {String(counts.pass)} pass</span>
            <span style={{ color: "#c62828" }}>✗ {String(counts.fail)} fail</span>
            <span style={{ color: "#f57c00" }}>? {String(counts.needs_review)} review</span>
            <span style={{ color: "#999" }}>– {String(counts.not_applicable)} n/a</span>
          </div>
          <div style={{ marginLeft: "auto", color: "#666", fontSize: "0.85rem" }}>
            {String(qlResults.length)} clauses checked
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {(["all", "fail", "needs_review", "pass"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
            }}
            style={{
              padding: "0.3rem 0.8rem",
              border: filter === f ? "2px solid #1976d2" : "1px solid #ccc",
              background: filter === f ? "#e3f2fd" : "#fff",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.82rem",
            }}
            aria-pressed={filter === f}
          >
            {f === "all"
              ? "All"
              : f === "needs_review"
                ? "Needs review"
                : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        {sorted.length === 0 ? (
          <div style={{ padding: "1rem", color: "#999" }}>
            No results match the selected filter.
          </div>
        ) : (
          sorted.map((r, i) => (
            <ResultRow key={`${r.clauseId}-${String(i)}`} r={r} i={i} total={sorted.length} />
          ))
        )}
      </div>

      {/* Manual-only checklist */}
      <div
        style={{
          border: "1px dashed #999",
          borderRadius: "8px",
          padding: "1rem 1.5rem",
          background: "#fffde7",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#f57f17" }}>Manual review required</h3>
        <table style={{ width: "100%", fontSize: "0.83rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e0e0e0", color: "#666" }}>
              <th style={{ padding: "0.3rem", textAlign: "left" }}>Clause</th>
              <th style={{ padding: "0.3rem", textAlign: "left" }}>Description</th>
              <th style={{ padding: "0.3rem" }}>Reviewed?</th>
            </tr>
          </thead>
          <tbody>
            {[...QUALITY_MANUAL, ...LIFECYCLE_MANUAL].map((c) => (
              <tr key={c.clauseId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "0.3rem" }}>
                  <strong>{c.clauseId}</strong>
                </td>
                <td style={{ padding: "0.3rem" }}>{c.title}</td>
                <td style={{ padding: "0.3rem", textAlign: "center" }}>
                  <input type="checkbox" aria-label={`Reviewed ${c.clauseId}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SummaryTab ────────────────────────────────────────────────────────────────

function SummaryTab({
  qlResults,
  a11yResults,
  secResults,
  onTabChange,
}: {
  qlResults: CheckResult[];
  a11yResults: ClauseResultData[];
  secResults: CyberClauseResult[];
  onTabChange: (tab: ActiveTab) => void;
}): JSX.Element {
  const allResults = [...qlResults, ...a11yResults, ...secResults];
  const failures = allResults.filter((r) => r.status === "fail");
  const qlScore = computeScore(qlResults);
  const a11yScore = computeScore(a11yResults);
  const secScore = computeScore(secResults);

  // Counts per section
  function sectionCounts(results: (CheckResult | ClauseResultData | CyberClauseResult)[]) {
    return {
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      review: results.filter((r) => r.status === "needs_review").length,
    };
  }
  const qc = sectionCounts(qlResults);
  const ac = sectionCounts(a11yResults);
  const sc = sectionCounts(secResults);

  return (
    <div>
      {/* Section score grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { label: "Quality (§5.1+§5.4)", score: qlScore, counts: qc, tab: "quality" as ActiveTab },
          {
            label: "Accessibility (§5.2)",
            score: a11yScore,
            counts: ac,
            tab: "accessibility" as ActiveTab,
          },
          {
            label: "Cybersecurity (§5.3)",
            score: secScore,
            counts: sc,
            tab: "cybersecurity" as ActiveTab,
          },
        ].map((s) => (
          <div
            key={s.tab}
            onClick={() => {
              onTabChange(s.tab);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") onTabChange(s.tab);
            }}
            style={{
              padding: "1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#444",
              }}
            >
              {s.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: scoreColor(s.score) }}>
                {s.score === null ? "–" : `${String(s.score)}%`}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#666" }}>
                ✗ {String(s.counts.fail)} fail
                <br />? {String(s.counts.review)} review
                <br />✓ {String(s.counts.pass)} pass
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#1976d2", marginTop: "0.4rem" }}>
              → View details
            </div>
          </div>
        ))}
      </div>

      {/* Failures list */}
      {failures.length === 0 ? (
        <div
          style={{
            padding: "1rem",
            background: "#e8f5e9",
            borderRadius: "8px",
            color: "#2e7d32",
            fontWeight: "bold",
          }}
        >
          ✓ No failures detected on this page.
        </div>
      ) : (
        <>
          <h3 style={{ color: "#c62828", margin: "0 0 0.75rem" }}>
            ✗ {String(failures.length)} Failure{failures.length !== 1 ? "s" : ""} — fix required
          </h3>
          <div style={{ border: "1px solid #ffcdd2", borderRadius: "8px", overflow: "hidden" }}>
            {failures.map((r, i) => (
              <div
                key={`${r.clauseId}-${String(i)}`}
                style={{
                  padding: "0.7rem 1rem",
                  borderBottom: i < failures.length - 1 ? "1px solid #ffcdd2" : "none",
                  background: "#fff8f8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ color: "#c62828", fontWeight: "bold" }}>✗</span>
                  <strong style={{ fontSize: "0.9rem" }}>{r.clauseId}</strong>
                  <span
                    style={{
                      padding: "0.1rem 0.4rem",
                      borderRadius: "3px",
                      fontSize: "0.7rem",
                      background:
                        r.severity === "high"
                          ? "#c62828"
                          : r.severity === "medium"
                            ? "#f57c00"
                            : "#666",
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {r.severity}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#999" }}>
                    {r.clauseId.startsWith("5.1") || r.clauseId.startsWith("5.4")
                      ? "Quality"
                      : r.clauseId.startsWith("5.2")
                        ? "Accessibility"
                        : "Cybersecurity"}
                  </span>
                </div>
                <div style={{ fontSize: "0.87rem", color: "#444" }}>{r.evidence}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────

export function HomePage(): JSX.Element {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<CheckResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");

  function validateUrl(input: string): string | null {
    if (!input.trim()) return "Please enter a URL";
    try {
      const parsed = new URL(
        input.trim().startsWith("http") ? input.trim() : `https://${input.trim()}`,
      );
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        return "URL must start with http:// or https://";
      if (!ALLOWED_DOMAIN_RE.test(parsed.hostname))
        return "Only .gov.in, .nic.in, .ac.in, .res.in, and .edu.in domains are supported";
      return null;
    } catch {
      return "Invalid URL format";
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setReport(null);
    const trimmed = url.trim();
    const finalUrl =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const validationError = validateUrl(finalUrl);
    if (validationError) {
      setError(validationError);
      return;
    }
    setRunning(true);
    setActiveTab("summary");
    try {
      const res = await fetch(`${API_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? `Server returned ${String(res.status)}`);
        return;
      }
      setReport((await res.json()) as CheckResponse);
    } catch (err) {
      setError(
        `Cannot connect to API at ${API_URL}. Make sure the API server is running.\n(${String(err)})`,
      );
    } finally {
      setRunning(false);
    }
  }

  // ── Report view ───────────────────────────────────────────────────────────
  if (report) {
    const qlResults = report.results.filter(
      (r) => r.clauseId.startsWith("5.1") || r.clauseId.startsWith("5.4"),
    );
    const a11yResults = report.results
      .filter((r) => r.clauseId.startsWith("5.2"))
      .map(
        (r): ClauseResultData => ({
          clauseId: r.clauseId,
          status: r.status,
          severity: r.severity,
          evidence: r.evidence,
          detail: r.detail,
        }),
      );
    const secResults = report.results
      .filter((r) => r.clauseId.startsWith("5.3"))
      .map(
        (r): CyberClauseResult => ({
          clauseId: r.clauseId,
          status: r.status,
          severity: r.severity,
          evidence: r.evidence,
          detail: r.detail,
        }),
      );

    const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
    for (const r of report.results) counts[r.status]++;
    const applicable = report.results.length - counts.not_applicable;
    const overallScore = applicable === 0 ? 0 : Math.round((counts.pass / applicable) * 100);
    const a11yScore = computeScore(a11yResults);
    const secScore = computeScore(secResults);

    const TAB_LABELS: { id: ActiveTab; label: string }[] = [
      { id: "summary", label: "Summary" },
      {
        id: "quality",
        label: `Quality (${String(qlResults.filter((r) => r.status === "fail").length)} ✗)`,
      },
      {
        id: "accessibility",
        label: `Accessibility (${String(a11yResults.filter((r) => r.status === "fail").length)} ✗)`,
      },
      {
        id: "cybersecurity",
        label: `Cybersecurity (${String(secResults.filter((r) => r.status === "fail").length)} ✗)`,
      },
    ];

    return (
      <div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>GIGW 3.0 Compliance Report</h1>
            <p style={{ margin: "0.3rem 0 0", color: "#555", fontSize: "0.9rem" }}>
              <strong>{report.title}</strong>
            </p>
            <p style={{ margin: "0.15rem 0 0", color: "#888", fontSize: "0.82rem" }}>
              {report.url} · checked in {String(Math.round(report.timing / 1000))}s ·{" "}
              {String(report.results.length)} clauses · {String(counts.fail)} failures
            </p>
          </div>
          <button
            onClick={() => {
              setReport(null);
              setUrl("");
            }}
            style={{
              padding: "0.4rem 0.8rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            ← Check another site
          </button>
        </div>

        {/* Overall + section score badges */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            background: overallScore >= 80 ? "#e8f5e9" : overallScore >= 50 ? "#fff8e1" : "#ffebee",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <ScoreBadge label="Overall" score={overallScore} size="large" />
          <ScoreBadge label="Quality" score={computeScore(qlResults)} />
          <ScoreBadge label="Accessibility" score={a11yScore} />
          <ScoreBadge label="Cybersecurity" score={secScore} />
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "1.5rem",
              fontSize: "0.9rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#2e7d32" }}>✓ {String(counts.pass)} pass</span>
            <span style={{ color: "#c62828" }}>✗ {String(counts.fail)} fail</span>
            <span style={{ color: "#f57c00" }}>? {String(counts.needs_review)} review</span>
            <span style={{ color: "#999" }}>– {String(counts.not_applicable)} n/a</span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
            marginBottom: "1rem",
            borderBottom: "2px solid #e0e0e0",
            flexWrap: "wrap",
          }}
        >
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
              }}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderBottom: activeTab === t.id ? "3px solid #1976d2" : "3px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontWeight: activeTab === t.id ? "bold" : "normal",
                color: activeTab === t.id ? "#1976d2" : "#555",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
              }}
              aria-selected={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — all wired to real data */}
        {activeTab === "summary" && (
          <SummaryTab
            qlResults={qlResults}
            a11yResults={a11yResults}
            secResults={secResults}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === "quality" && <QualityTab qlResults={qlResults} />}
        {activeTab === "accessibility" && (
          <AccessibilityReport results={a11yResults} score={a11yScore} />
        )}
        {activeTab === "cybersecurity" && (
          <CybersecurityReport results={secResults} score={secScore} />
        )}
      </div>
    );
  }

  // ── URL submission form ───────────────────────────────────────────────────
  return (
    <div>
      <h1>GIGW 3.0 Compliance Checker</h1>
      <p style={{ color: "#555", maxWidth: "600px" }}>
        Audit any Indian government or institution website against GIGW 3.0 — covering quality,
        accessibility (WCAG 2.1 AA), cybersecurity, and lifecycle guidelines.
      </p>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        style={{ maxWidth: "600px", marginTop: "1.5rem" }}
      >
        <label
          htmlFor="seed-url"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
        >
          Website URL:
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            id="seed-url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            placeholder="uidai.gov.in  or  https://nitj.ac.in/"
            style={{
              flex: 1,
              padding: "0.65rem 0.8rem",
              fontSize: "1rem",
              border: error ? "2px solid #c62828" : "1px solid #ccc",
              borderRadius: "4px",
            }}
            disabled={running}
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : undefined}
          />
          <button
            type="submit"
            disabled={running}
            style={{
              padding: "0.65rem 1.5rem",
              fontSize: "1rem",
              background: running ? "#bbb" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: running ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {running ? "Checking…" : "Check Site"}
          </button>
        </div>

        {running && (
          <div style={{ marginTop: "1rem" }}>
            <div
              style={{
                height: "4px",
                background: "#bbdefb",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#1976d2",
                  borderRadius: "2px",
                  animation: "pulse 1.5s ease-in-out infinite alternate",
                }}
              />
              <style>{`@keyframes pulse { from { width: 20%; } to { width: 85%; } }`}</style>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
              Running 39 GIGW checkers against {url} — this takes 20–40 seconds…
            </p>
          </div>
        )}

        {error && (
          <p
            id="url-error"
            role="alert"
            style={{
              color: "#c62828",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#888" }}>
          Supported: <code>.gov.in</code> · <code>.nic.in</code> · <code>.ac.in</code> ·{" "}
          <code>.res.in</code> · <code>.edu.in</code>
        </div>
      </form>

      <div style={{ marginTop: "2.5rem", fontSize: "0.85rem", color: "#bbb" }}>
        <p>Or open a saved report:</p>
        <a href="/reports/cmww59aw300faqj8wb7x8gq4l" style={{ color: "#1976d2" }}>
          → nitj.ac.in multi-page report (4 pages)
        </a>
      </div>
    </div>
  );
}
