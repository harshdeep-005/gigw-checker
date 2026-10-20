import type { JSX } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { HomePage } from "./shell/HomePage.js";
import { NotFoundPage } from "./shell/NotFoundPage.js";
import { AccessibilityReport } from "./accessibility/AccessibilityReport.js";
import type { ClauseResultData } from "./accessibility/ClauseResultRow.js";
import { CybersecurityReport } from "./cybersecurity/CybersecurityReport.js";
import type { CyberClauseResult } from "./cybersecurity/CybersecurityReport.js";

/**
 * App shell — shared nav, routing, layout.
 */
export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <header role="banner" style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <nav aria-label="Main navigation" style={{ display: "flex", gap: "1rem" }}>
          <NavLink to="/" style={({ isActive }) => (isActive ? { fontWeight: "bold" } : undefined)}>
            Home
          </NavLink>
          <NavLink
            to="/accessibility"
            style={({ isActive }) => (isActive ? { fontWeight: "bold" } : undefined)}
          >
            Accessibility
          </NavLink>
          <NavLink
            to="/cybersecurity"
            style={({ isActive }) => (isActive ? { fontWeight: "bold" } : undefined)}
          >
            Cybersecurity
          </NavLink>
        </nav>
      </header>

      <main id="main-content" role="main" style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/accessibility" element={<AccessibilityPreview />} />
          <Route path="/cybersecurity" element={<CybersecurityPreview />} />
          {/* Additional routes added in Phase 2/3:
              /reports/:id                    → SiteReport overview
              /reports/:id/accessibility      → AccessibilityReport with real data
              /reports/:id/cybersecurity      → CybersecurityReport
              /reports/:id/quality             → QualityReport (Member B)
              /reports/:id/lifecycle           → LifecycleReport (Member B)
              /reports/:id/manual-review       → manual checklist (shared)
          */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

/**
 * AccessibilityPreview — placeholder view with sample data so the UI is
 * visible before the full pipeline is wired (Phase 3). Replaced by real
 * API-fetched data when /reports/:id/accessibility route is implemented.
 */
function AccessibilityPreview(): JSX.Element {
  const sampleResults: ClauseResultData[] = [
    {
      clauseId: "5.2.49",
      status: "fail",
      severity: "high",
      evidence:
        "[button-name] Ensures buttons have discernible text. First failing element: .mui-1ig7sdw",
      detail: { checkerId: "a11y-axe-core", axeRule: "button-name" },
    },
    {
      clauseId: "5.2.14",
      status: "needs_review",
      severity: "high",
      evidence:
        "[color-contrast] Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds.",
      detail: { checkerId: "a11y-axe-core", axeRule: "color-contrast" },
    },
    {
      clauseId: "5.2.7",
      status: "pass",
      severity: "high",
      evidence: "All axe-core rules for this clause passed",
      detail: null,
    },
    {
      clauseId: "5.2.38",
      status: "pass",
      severity: "high",
      evidence: "All axe-core rules for this clause passed",
      detail: null,
    },
    {
      clauseId: "5.2.11",
      status: "not_applicable",
      severity: "medium",
      evidence: "No applicable elements found on this page",
      detail: null,
    },
  ];

  return <AccessibilityReport results={sampleResults} score={85} />;
}

function CybersecurityPreview(): JSX.Element {
  const sampleResults: CyberClauseResult[] = [
    {
      clauseId: "5.3.1-code-headers",
      status: "pass",
      severity: "medium",
      evidence: "Response headers do not disclose server version or technology stack.",
      detail: null,
    },
    {
      clauseId: "5.3.1-code-cookies",
      status: "pass",
      severity: "high",
      evidence: "All 2 cookie(s) have Secure and HttpOnly flags set.",
      detail: null,
    },
    {
      clauseId: "5.3.2-https",
      status: "pass",
      severity: "high",
      evidence: "HTTPS is enforced and HSTS header is present. No mixed content detected.",
      detail: null,
    },
    {
      clauseId: "5.3.2-ciphers",
      status: "needs_review",
      severity: "high",
      evidence:
        "No mixed content detected. Full cipher suite verification requires a server-side TLS scan.",
      detail: null,
    },
    {
      clauseId: "5.3.3",
      status: "pass",
      severity: "medium",
      evidence:
        "Privacy policy link found. Verify policy content is current and approved by the WIM.",
      detail: null,
    },
  ];

  return <CybersecurityReport results={sampleResults} score={90} />;
}
