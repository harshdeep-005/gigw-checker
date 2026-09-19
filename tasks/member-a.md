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
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2. 16 checker files needed: text-alternatives.ts (5.2.1), captions.ts (5.2.3), keyboard.ts (5.2.21, 5.2.22), colour.ts (5.2.12), reflow.ts (5.2.15, 5.2.17), images-of-text.ts (5.2.16), text-spacing.ts (5.2.19), motion.ts (5.2.25), flashing.ts (5.2.26), focus-order.ts (5.2.29), link-purpose.ts (5.2.30), headings.ts (5.2.32), language-parts.ts (5.2.39), navigation.ts (5.2.42, 5.2.43), error-id.ts (5.2.44), status-messages.ts (5.2.50). Each must be registered in index.ts.

---

### [A-011] Build accessibility dashboard view
Status: todo
Date: 2026-08-21
Depends on: A-009, A-010
Notes: Phase 2. Populate apps/dashboard/src/accessibility/ after checkers are complete.

---

### [A-012] Build Section 5.3 cybersecurity checkers — automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2. headers.ts (5.3.1-code-headers), cookies.ts (5.3.1-code-cookies), tls.ts (5.3.2-tls, 5.3.2-https, 5.3.2-ciphers). Passive only — requirements.md §7 is the hard boundary.

---

### [A-013] Build Section 5.3 cybersecurity checkers — semi-automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-012
Notes: Phase 2. error-page.ts (natural 404 only), tls-comms.ts, waf.ts, policies.ts. Passive only.

---

### [A-014] Build cybersecurity dashboard view
Status: todo
Date: 2026-08-21
Depends on: A-012, A-013
Notes: Phase 2. Populate apps/dashboard/src/cybersecurity/.

---

### [A-015] Integration testing — A's checkers end-to-end against real .gov.in sites
Status: todo
Date: 2026-08-21
Depends on: A-010, A-013, B-aggregation-service wired (check brain/member-b.md for status)
Notes: Phase 3. Run full pipeline: crawl → check → aggregate → dashboard. Log false positives/negatives in brain/member-a.md.

---
