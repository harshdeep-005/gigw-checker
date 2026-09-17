# Tasks — Member A

See rules.md for the task entry format and ID convention.
Task IDs are permanent — never reuse or renumber.

---

### [A-001] Read and verify all planning docs
Status: done
Date: 2026-08-21
Depends on: —
Notes: requirements.md, design.md, schema.md, implementationPlan.md, rules.md all read and cross-references verified clean. §6→§7 stale references fixed. 3-member→2-member ownership updates confirmed.

---

### [A-002] Populate tasks/member-a.md with initial task list
Status: done
Date: 2026-08-21
Depends on: A-001
Notes: This file. Rewritten after discovering monorepo was already scaffolded further than expected.

---

### [A-003] Scaffold monorepo root
Status: done
Date: 2026-08-21
Depends on: A-001
Notes: package.json (workspaces), tsconfig.base.json, eslint.config.js, .prettierrc, docker-compose.yml, .gitignore, .env.example, CI skeleton (.github/workflows/ci.yml) all present.

---

### [A-004] Scaffold shared packages (crawler, queue, api, db, aggregation, report-pdf)
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: All packages under packages/ stubbed with package.json + src/index.ts + tsconfig.json.

---

### [A-005] Scaffold dashboard shell
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: apps/dashboard/ exists with Vite + React setup, src/shell/, src/accessibility/, src/cybersecurity/, src/quality-lifecycle/ directories present.

---

### [A-006] Scaffold packages/checkers/accessibility/
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: src/index.ts and src/types.ts in place. CheckerModule / CheckerFn / CheckerContext types defined, mirror schema.md §3. Registry stub exported. Checker files planned in index.ts comment.

---

### [A-007] Scaffold packages/checkers/cybersecurity/
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: Same structure as accessibility. Passive-only warning banner in index.ts. Checker files planned. Renamed from original A-008 ordering — see note below.

---

### [A-008] Proof-of-concept: axe-core running inside Playwright on a real .gov.in page
Status: todo
Date: 2026-08-21
Depends on: A-006, @gigw/db types resolvable (need db package to export CheckerResult)
Notes: Phase 1 exit criterion for A. Goal: one real CheckerResult[] returned from a live .gov.in page. Must confirm axe-core + Playwright wiring works end-to-end before building out all checkers.

---

### [A-009] Build Section 5.2 accessibility checkers — automatable clauses (axe-core)
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2. Implement axe-core.ts covering: 5.2.7, 5.2.11, 5.2.13, 5.2.14, 5.2.17, 5.2.18, 5.2.27, 5.2.28, 5.2.31, 5.2.33, 5.2.36, 5.2.38, 5.2.45, 5.2.48, 5.2.49.

---

### [A-010] Build Section 5.2 accessibility checkers — semi-automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2. Implement: text-alternatives.ts, captions.ts, keyboard.ts, colour.ts, reflow.ts, images-of-text.ts, text-spacing.ts, motion.ts, flashing.ts, focus-order.ts, link-purpose.ts, headings.ts, language-parts.ts, navigation.ts, error-id.ts, status-messages.ts. (see index.ts for clause mapping)

---

### [A-011] Build accessibility dashboard view
Status: todo
Date: 2026-08-21
Depends on: A-009, A-010
Notes: Phase 2. Populate apps/dashboard/src/accessibility/ with results display after checkers are solid.

---

### [A-012] Build Section 5.3 cybersecurity checkers — automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2. Implement: headers.ts (5.3.1-code-headers), cookies.ts (5.3.1-code-cookies), tls.ts (5.3.2-tls, 5.3.2-https, 5.3.2-ciphers). Passive only — requirements.md §7 is the hard boundary.

---

### [A-013] Build Section 5.3 cybersecurity checkers — semi-automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-012
Notes: Phase 2. Implement: error-page.ts (natural 404 only), tls-comms.ts, waf.ts, policies.ts. Passive only.

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
