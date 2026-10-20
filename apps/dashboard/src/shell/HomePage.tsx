import { useState } from "react";
import type { JSX } from "react";
import { AccessibilityReport } from "../accessibility/AccessibilityReport.js";
import type { ClauseResultData } from "../accessibility/ClauseResultRow.js";
import { CybersecurityReport } from "../cybersecurity/CybersecurityReport.js";
import type { CyberClauseResult } from "../cybersecurity/CybersecurityReport.js";

/**
 * HomePage — URL submission + direct check results.
 *
 * Uses POST /check which runs all checkers against a single page
 * immediately (no crawl queue needed). Phase 3 will add full-site
 * crawling via the job queue.
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

type ActiveTab = "summary" | "accessibility" | "cybersecurity";

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
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "URL must start with http:// or https://";
      }
      if (!ALLOWED_DOMAIN_RE.test(parsed.hostname)) {
        return "Only .gov.in, .nic.in, .ac.in, .res.in, and .edu.in domains are supported";
      }
      return null;
    } catch {
      return "Invalid URL format";
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setReport(null);

    // Auto-add https:// if missing
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

      const data = (await res.json()) as CheckResponse;
      setReport(data);
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

    const qlResults = report.results.filter((r) => r.clauseId.startsWith("5.1"));

    const counts = { pass: 0, fail: 0, needs_review: 0, not_applicable: 0 };
    for (const r of report.results) counts[r.status]++;

    const applicable = report.results.length - counts.not_applicable;
    const overallScore = applicable === 0 ? 0 : Math.round((counts.pass / applicable) * 100);

    const a11yScore =
      a11yResults.length === 0
        ? null
        : Math.round(
            (a11yResults.filter((r) => r.status === "pass").length /
              (a11yResults.filter((r) => r.status !== "not_applicable").length || 1)) *
              100,
          );

    const secScore =
      secResults.length === 0
        ? null
        : Math.round(
            (secResults.filter((r) => r.status === "pass").length /
              (secResults.filter((r) => r.status !== "not_applicable").length || 1)) *
              100,
          );

    return (
      <div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>GIGW 3.0 Compliance Report</h1>
            <p style={{ margin: "0.3rem 0 0", color: "#666", fontSize: "0.9rem" }}>
              <strong>{report.title}</strong> — {report.url}
            </p>
            <p style={{ margin: "0.2rem 0 0", color: "#999", fontSize: "0.8rem" }}>
              Checked in {String(Math.round(report.timing / 1000))}s ·{" "}
              {String(report.results.length)} clauses checked · {String(counts.fail)} failures
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

        {/* Overall score bar */}
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
          <ScoreBadge label="Accessibility" score={a11yScore} />
          <ScoreBadge label="Cybersecurity" score={secScore} />
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem" }}>
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
          }}
        >
          {(["summary", "accessibility", "cybersecurity"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
              }}
              style={{
                padding: "0.5rem 1.2rem",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid #1976d2" : "3px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontWeight: activeTab === tab ? "bold" : "normal",
                color: activeTab === tab ? "#1976d2" : "#555",
                textTransform: "capitalize",
                fontSize: "0.95rem",
              }}
              aria-selected={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "summary" && (
          <SummaryTab qlResults={qlResults} a11yResults={a11yResults} secResults={secResults} />
        )}
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
        Enter a government or institution website to run a GIGW 3.0 compliance audit — covering
        accessibility (WCAG 2.1 AA), quality, and cybersecurity guidelines.
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
              Running checkers against {url} — this takes 20–40 seconds…
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
          Supported domains: <code>.gov.in</code> · <code>.nic.in</code> · <code>.ac.in</code> ·{" "}
          <code>.res.in</code> · <code>.edu.in</code>
        </div>
      </form>

      <div style={{ marginTop: "2.5rem", fontSize: "0.85rem", color: "#999" }}>
        <p>Preview dashboard views with sample data:</p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <a href="/accessibility" style={{ color: "#1976d2" }}>
            → Accessibility dashboard
          </a>
          <a href="/cybersecurity" style={{ color: "#f57c00" }}>
            → Cybersecurity dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({
  label,
  score,
  size = "normal",
}: {
  label: string;
  score: number | null;
  size?: "normal" | "large";
}): JSX.Element {
  const s = score ?? 0;
  const color = score === null ? "#999" : s >= 80 ? "#2e7d32" : s >= 50 ? "#f57c00" : "#c62828";
  const dim = size === "large" ? 80 : 60;
  const fontSize = size === "large" ? "1.3rem" : "1rem";

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
          fontSize,
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

function SummaryTab({
  qlResults,
  a11yResults,
  secResults,
}: {
  qlResults: CheckResult[];
  a11yResults: ClauseResultData[];
  secResults: CyberClauseResult[];
}): JSX.Element {
  const failures = [
    ...qlResults.filter((r) => r.status === "fail"),
    ...a11yResults.filter((r) => r.status === "fail"),
    ...secResults.filter((r) => r.status === "fail"),
  ];

  return (
    <div>
      {failures.length === 0 ? (
        <p style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ No failures detected on this page.</p>
      ) : (
        <>
          <h3 style={{ color: "#c62828" }}>
            ✗ {String(failures.length)} Failure{failures.length !== 1 ? "s" : ""}
          </h3>
          <div style={{ border: "1px solid #ffcdd2", borderRadius: "8px", overflow: "hidden" }}>
            {failures.map((r, i) => (
              <div
                key={`${r.clauseId}-${String(i)}`}
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: i < failures.length - 1 ? "1px solid #ffcdd2" : "none",
                  background: "#fff8f8",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "#c62828", fontWeight: "bold" }}>✗</span>
                  <strong>{r.clauseId}</strong>
                  <span
                    style={{
                      padding: "0.1rem 0.4rem",
                      borderRadius: "3px",
                      fontSize: "0.72rem",
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
                </div>
                <div style={{ fontSize: "0.88rem", color: "#444", marginTop: "0.3rem" }}>
                  {r.evidence}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <h3>§5.1 Quality ({String(qlResults.length)} checks)</h3>
        <MiniResultTable results={qlResults} />
      </div>
    </div>
  );
}

function MiniResultTable({
  results,
}: {
  results: CheckResult[] | ClauseResultData[] | CyberClauseResult[];
}): JSX.Element {
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

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "4px",
        overflow: "hidden",
        fontSize: "0.85rem",
      }}
    >
      {results.map((r, i) => (
        <div
          key={`${r.clauseId}-${String(i)}`}
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.4rem 0.6rem",
            borderBottom: i < results.length - 1 ? "1px solid #f5f5f5" : "none",
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: STATUS_COLOR[r.status], minWidth: "1rem", fontWeight: "bold" }}>
            {STATUS_ICON[r.status]}
          </span>
          <strong style={{ minWidth: "110px" }}>{r.clauseId}</strong>
          <span style={{ color: "#555", flex: 1 }}>{r.evidence.slice(0, 100)}</span>
        </div>
      ))}
    </div>
  );
}
