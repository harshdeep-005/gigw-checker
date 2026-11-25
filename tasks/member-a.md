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
Notes: packages/crawler, queue, api, db, aggregation, report-pdf all stubbed. packages/checkers/* glob fixed. @types/node added to all. composite:true on all tsconfigs.

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
Notes: src/types.ts defines CheckerModule, CheckerContext, CheckerFn, CheckerResultData. DOM lib added to tsconfig.

---

### [A-007] Scaffold packages/checkers/cybersecurity/
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: Passive-only constraint documented in index.ts.

---

### [A-008] Proof-of-concept: axe-core running inside Playwright on a real .gov.in page
Status: done
Date: 2026-08-21
Depends on: A-006
Notes: axe-core.ts — 40+ axe rules mapped to 15 §5.2 clauses. Verified live against uidai.gov.in. Key fix: pages must be from browser.newContext().

---

### [A-009] Build Section 5.2 accessibility checkers — automatable clauses (axe-core)
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: Covered by axe-core.ts. AXE_CORE_CLAUSE_IDS derived from AXE_RULE_MAP to prevent divergence.

---

### [A-010] Build Section 5.2 accessibility checkers — semi-automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: 16 checker files built and registered. 47 unit tests pass. Files: text-alternatives, captions, keyboard, colour, reflow, images-of-text, text-spacing, motion, flashing, focus-order, link-purpose, headings, language-parts, navigation, error-id, status-messages.

---

### [A-011] Build accessibility dashboard view
Status: done
Date: 2026-08-21
Depends on: A-009, A-010
Notes: AccessibilityReport, AccessibilityScoreCard, ClauseResultRow built. Filterable results + manual-review checklist (15 manual-only clauses). Wired into App.tsx at /accessibility.

---

### [A-012] Build Section 5.3 cybersecurity checkers — automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-008
Notes: headers.ts (5.3.1-code-headers), cookies.ts (5.3.1-code-cookies), tls.ts (5.3.2-tls/https/ciphers). All passive only per §7.

---

### [A-013] Build Section 5.3 cybersecurity checkers — semi-automatable clauses
Status: done
Date: 2026-08-21
Depends on: A-012
Notes: error-page.ts, tls-comms.ts, waf.ts, policies.ts. All passive only per §7.

---

### [A-014] Build cybersecurity dashboard view
Status: done
Date: 2026-08-21
Depends on: A-012, A-013
Notes: CybersecurityReport, CybersecurityScoreCard built. Manual-audit checklist with 6 manual-only clause groups. Wired at /cybersecurity.

---

### [A-015] Integration testing — A's checkers end-to-end against real .gov.in sites
Status: done
Date: 2026-11-25
Depends on: A-010, A-013, B-aggregation-service wired
Notes: Phase 3 complete. Built crawl-worker (packages/crawler/src/crawl-worker.ts), check-worker (packages/checker-worker/src/index.ts — 39 checkers from both A and B), report page (apps/dashboard/src/report/ReportPage.tsx). Key fix: check worker must use routeUrl (not page.url()) as pageUrl or aggregation join fails. Key fix: DB-count-based completion detection — no global queue counts. Verified multi-page crawl on nitj.ac.in: 5 routes, 4 checked, 333 results, 4 PageReports, SiteReport scored 51% overall. Dashboard report page verified in headless Playwright: 8/8 checks pass, 0 JS errors. All checkpoints passed.

---
