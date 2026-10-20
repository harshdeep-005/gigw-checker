# Tasks — Member A

See rules.md for the task entry format and ID convention.
Task IDs are permanent — never reuse or renumber.

---

### [A-001] Read and verify all planning docs
Status: done
Date: 2026-08-21
Depends on: —
Notes: requirements.md, design.md, schema.md, implementationPlan.md, rules.md all read. All cross-references verified clean after §6→§7 fix and 3-member→2-member ownership updates.

---

### [A-002] Populate tasks/member-a.md with initial task list
Status: done
Date: 2026-08-21
Depends on: A-001
Notes: This file.

---

### [A-003] Scaffold monorepo root
Status: done
Date: 2026-08-21
Depends on: A-001
Notes: package.json (workspaces + scripts), tsconfig.json (root references), tsconfig.base.json, eslint.config.js, .prettierrc, docker-compose.yml, .gitignore, .env.example, .github/workflows/ci.yml all present and verified.

---

### [A-004] Scaffold shared packages
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: packages/crawler, queue, api, db, aggregation, report-pdf all stubbed with package.json, src/index.ts, tsconfig.json. All packages in workspace (packages/checkers/* glob fixed). @types/node added to all. composite:true on all tsconfigs.

---

### [A-005] Scaffold dashboard shell
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: apps/dashboard with Vite + React. src/shell/, src/accessibility/, src/cybersecurity/, src/quality-lifecycle/ present.

---

### [A-006] Scaffold packages/checkers/accessibility/
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: src/types.ts defines CheckerModule, CheckerContext (with html, page, pageUrl), CheckerFn. src/index.ts exports registry. DOM lib added to tsconfig.

---

### [A-007] Scaffold packages/checkers/cybersecurity/
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: Same structure as accessibility. Passive-only constraint documented in index.ts.

---

### [A-008] Proof-of-concept: axe-core running inside Playwright on a real .gov.in page
Status: done
Date: 2026-08-21
Depends on: A-006
Notes: axe-core.ts implemented — 40+ axe rules mapped to 15 GIGW §5.2 clauses. Verified live against uidai.gov.in: 15 results returned (11 pass, 1 fail, 2 needs_review, 1 not_applicable). Real failure: clause 5.2.49 — button without accessible text (.mui-1ig7sdw). All shapes valid. Registered in index.ts. Key fix: pages must be created from browser.newContext(), not browser.newPage() directly. See brain/member-a.md for full notes.

---

### [A-009] Build Section 5.2 accessibility checkers — automatable clauses (axe-core)
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: Covered by axe-core.ts (A-008). All 15 automatable §5.2 clauses are mapped in AXE_RULE_MAP.

---

### [A-010] Build Section 5.2 accessibility checkers — semi-automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: All 16 checker files built, registered in index.ts, 47 unit tests pass. Files: text-alternatives.ts, captions.ts, keyboard.ts, reflow.ts, link-purpose.ts, headings.ts, colour.ts, images-of-text.ts, text-spacing.ts, motion.ts, flashing.ts, focus-order.ts, language-parts.ts, navigation.ts, error-id.ts, status-messages.ts. Bug sweep also completed: fixed clause IDs in quality-lifecycle checkers, introduced CheckerResultData type (removes id/pageReportId from checker output), crawler null-safe browser/context, robots allow logic, pageCap off-by-one, section scores return null for unevaluated, React.JSX.Element imports. Final: 118/118 tests pass, 0 typecheck errors, 0 lint errors.

---

### [A-011] Build accessibility dashboard view
Status: done
Date: 2026-08-21
Depends on: A-009, A-010
Notes: Built 3 components in apps/dashboard/src/accessibility/: AccessibilityScoreCard (score circle + counts), ClauseResultRow (expandable clause with status/severity/evidence), AccessibilityReport (filterable results list + manual-review checklist with 15 manual-only clauses). Wired into App.tsx routing at /accessibility with sample data preview. All checks pass.

---

### [A-012] Build Section 5.3 cybersecurity checkers — automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: Built 3 files: headers.ts (5.3.1-code-headers — Server/X-Powered-By version disclosure), cookies.ts (5.3.1-code-cookies — Secure + HttpOnly flags), tls.ts (5.3.2-tls/https/ciphers — HTTPS enforcement, HSTS, mixed content). All passive only per requirements.md §7. Registered in cybersecurity index.ts. 118/118 tests, 0 errors.

---

### [A-013] Build Section 5.3 cybersecurity checkers — semi-automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-012
Notes: Built 4 files: error-page.ts (5.3.1-code-errors — natural 404, stack trace pattern detection), tls-comms.ts (5.3.1-code-tls-comms — 3rd-party HTTP requests via PerformanceObserver), waf.ts (5.3.2-waf — WAF header inference), policies.ts (5.3.3 — privacy/security/contingency policy link detection). All passive only. Registered in cybersecurity index.ts. 118/118 tests, 0 errors.

---

### [A-014] Build cybersecurity dashboard view
Status: done
Date: 2026-08-21
Depends on: A-012, A-013
Notes: Built CybersecurityScoreCard (score circle + counts + passive-only disclaimer) and CybersecurityReport (filterable results + manual-audit checklist with 6 manual-only clause groups). Wired into App.tsx routing at /cybersecurity with sample data preview. All checks pass.

---

### [A-015] Integration testing — A's checkers end-to-end against real .gov.in sites
Status: todo
Date: 2026-08-21
Depends on: A-010, A-013, B-aggregation-service wired (check brain/member-b.md for status)
Notes: Phase 3. Run full pipeline: crawl → check → aggregate → dashboard. Log false positives/negatives in brain/member-a.md.

---
