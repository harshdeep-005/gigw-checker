# Tasks — Member A

See rules.md for the task entry format and ID convention.

---

### [A-001] Read and verify all planning docs
Status: done
Date: 2026-08-21
Depends on: —
Notes: requirements.md, design.md, schema.md, implementationPlan.md, rules.md all read and cross-references verified clean.

---

### [A-002] Populate tasks/member-a.md with Phase 0 + Phase 1 tasks
Status: done
Date: 2026-08-21
Depends on: A-001
Notes: This file.

---

### [A-003] Scaffold monorepo root (package.json, tsconfig base, .eslintrc, .prettierrc, docker-compose.yml, CI skeleton)
Status: done
Date: 2026-08-21
Depends on: A-001, B confirms ready to start
Notes: Created gigw-checker/ root — package.json (npm workspaces), tsconfig.base.json (strict TS), eslint.config.js (flat ESLint 9 + typescript-eslint strictTypeChecked), .prettierrc, .gitignore, docker-compose.yml (postgres 16 + redis 7 + api service), .env.example, .github/workflows/ci.yml (lint + format:check + typecheck + test on PR).

---

### [A-004] Set up shared packages scaffold (crawler, queue, api, db)
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: crawler (Playwright dep, CrawlOptions/CrawlResult types), queue (BullMQ + ioredis, typed job payloads), api (Fastify, /health stub + Dockerfile), db (Prisma schema mirroring schema.md §1-6 exactly — ClauseDefinition, CheckerResult, Route, PageReport, SiteReport, CrawlJob + singleton prisma client export). Also created: aggregation (computePageScore() fully implemented with unit tests, SEVERITY_WEIGHTS), report-pdf (PdfGenerationOptions stub), checker stubs for all three domains.

---

### [A-005] Set up dashboard shell (nav, routing, layout, mock SiteReport)
Status: done
Date: 2026-08-21
Depends on: A-003
Notes: Vite + React 18 + react-router-dom. App.tsx shell with BrowserRouter, header nav, main landmark. HomePage and NotFoundPage stubs. Domain stub folders (accessibility/, cybersecurity/, quality-lifecycle/) reserved with .gitkeep. URL submission form and report routing marked as Phase 1 TODOs.

---

### [A-006] Scaffold packages/checkers/accessibility/
Status: todo
Date: 2026-08-21
Depends on: A-003, schema.md v1.1 (frozen)
Notes: Create folder structure + index.ts exporting CheckerModule stubs. Install axe-core + @axe-core/playwright. Proof-of-concept: one real checker running inside Playwright.

---

### [A-007] Proof-of-concept: axe-core running inside Playwright page
Status: todo
Date: 2026-08-21
Depends on: A-006
Notes: Phase 1 exit criterion for A. Target: one CheckerResult[] returned from a real .gov.in page. Doesn't need to be production-ready — just proves the pipeline works.

---

### [A-008] Scaffold packages/checkers/cybersecurity/
Status: todo
Date: 2026-08-21
Depends on: A-007
Notes: Do NOT start until A-007 is done — per implementationPlan.md Phase 1 guidance. Passive inspection only (requirements.md §7).

---

### [A-009] Build Section 5.2 accessibility checkers — automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-007, schema.md v1.1
Notes: Phase 2 work. Covers clauses automatable via axe-core: 5.2.7, 5.2.11, 5.2.13, 5.2.14, 5.2.17, 5.2.18, 5.2.27, 5.2.28, 5.2.31, 5.2.33, 5.2.36, 5.2.38, 5.2.45, 5.2.48, 5.2.49.

---

### [A-010] Build Section 5.2 accessibility checkers — semi-automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-009
Notes: Phase 2 work. Covers: 5.2.1, 5.2.3, 5.2.8, 5.2.10, 5.2.12, 5.2.15, 5.2.16, 5.2.19, 5.2.21, 5.2.22, 5.2.25, 5.2.26, 5.2.29, 5.2.30, 5.2.32, 5.2.39, 5.2.42, 5.2.43, 5.2.44, 5.2.50.

---

### [A-011] Build accessibility dashboard view (apps/dashboard/accessibility/)
Status: todo
Date: 2026-08-21
Depends on: A-009, A-010
Notes: Phase 2 work. Build after checkers are solid, not before.

---

### [A-012] Build Section 5.3 cybersecurity checkers — automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-008
Notes: Phase 2 work. Covers: 5.3.1-code-headers, 5.3.1-code-cookies, 5.3.2-tls, 5.3.2-https, 5.3.2-ciphers. Passive only — requirements.md §7 is the hard boundary.

---

### [A-013] Build Section 5.3 cybersecurity checkers — semi-automatable clauses
Status: todo
Date: 2026-08-21
Depends on: A-012
Notes: Phase 2 work. Covers: 5.3.1-code-errors (natural 404 only), 5.3.1-code-tls-comms, 5.3.2-waf, 5.3.3.

---

### [A-014] Build cybersecurity dashboard view (apps/dashboard/cybersecurity/)
Status: todo
Date: 2026-08-21
Depends on: A-012, A-013
Notes: Phase 2 work. Build after checkers are solid.

---

### [A-015] Integration testing — A's checkers end-to-end against a real .gov.in site
Status: todo
Date: 2026-08-21
Depends on: A-010, A-013, Phase 3 infra ready (B's aggregation service wired)
Notes: Phase 3 work. Log false positives/negatives in brain/member-a.md.

---
