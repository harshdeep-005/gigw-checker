# Brain Log — Member A

Append-only. Never edit past entries. See rules.md for format.

---

## 2026-08-21 — Member A
- Read and verified all planning docs (requirements.md, design.md, schema.md, implementationPlan.md, rules.md, README.md). All cross-references clean after §6→§7 fix and 3-member→2-member ownership updates.
- Populated tasks/member-a.md with A-001 through A-015 spanning Phase 0 scaffold through Phase 3 integration testing.
- Phase 0 doc work is complete. Monorepo scaffold (A-003) is the next action — shared task, needs B to confirm readiness before merging.
- Decided to sequence cybersecurity scaffold (A-008) strictly after accessibility proof-of-concept (A-007), per implementationPlan.md Phase 1 guidance — not splitting attention across both domains early.
- Blocked on: nothing currently. A-003 onward waits on B's readiness signal (shared scaffold).
- Affects shared files: no.

---

## 2026-08-21 (update) — Member A
- Re-read workspace after tasks file was written — found monorepo was already scaffolded further than first assumed: package.json (npm workspaces), tsconfig.base.json, eslint.config.js, .prettierrc, docker-compose.yml, .github/workflows/ci.yml, all packages stubbed (crawler, queue, api, db, aggregation, report-pdf, checkers/accessibility, checkers/cybersecurity, checkers/quality-lifecycle), dashboard shell with Vite + React and all four src/ subdirectories present.
- Rewrote tasks/member-a.md to mark A-003 through A-007 as done and reflect actual current state.
- Actual Phase 1 start point: A-008 (axe-core proof-of-concept). Need @gigw/db to export CheckerResult before A-008 can compile — check brain/member-b.md for db package status.
- Blocked on: nothing yet. A-008 can start once db types are confirmed exportable.
- Affects shared files: tasks/member-a.md (own file).

---

## 2026-08-21 (Phase 1 start) — Member A
- Fixed 5 infrastructure blockers before writing any Phase 1 code: missing root tsconfig.json, composite:true absent from all package tsconfigs, @types/node missing everywhere, Prisma client not generated, checker packages not in workspace (packages/* glob was too shallow — added packages/checkers/*).
- Updated all vulnerable deps: playwright 1.46→1.55, react-router-dom 6.26→6.30, bullmq 5.12→5.81, fastify 4→5 (v5 API, updated stub).
- Implemented crawler core: packages/crawler/src/crawler.ts (BFS, robots.txt, depth/page cap, retries, DB writes via upsert), url-utils.ts (normalise/dedup, same-domain check), robots.ts (fetch + parse robots.txt, isAllowed check). 16 unit tests, all pass.
- Implemented queue wiring: packages/queue/src/index.ts — BullMQ CRAWL_QUEUE + CHECK_QUEUE, lazy singleton instances, addCrawlJob/addCheckJob helpers, createCrawlWorker/createCheckWorker factories, exponential backoff (3 attempts, 5s base).
- Implemented API: packages/api/src/index.ts — POST /jobs (domain validation .gov.in/.nic.in, creates CrawlJob, enqueues), GET /jobs/:id, GET /reports/:id (with pages+results), GET /health.
- Wrote DB seed: packages/db/prisma/seed.ts — all 88 ClauseDefinition rows across §5.1(25), §5.2(50), §5.3(11), §5.4(10). Uses tsx runner. Upsert-safe (can re-seed without duplicates). Added tsx@4.17.0 to db devDeps.
- Implemented axe-core checker (A-008): packages/checkers/accessibility/src/axe-core.ts — full CheckerModule, maps 40+ axe rule IDs to 15 GIGW clauses, status mapping (fail/needs_review/pass/not_applicable), typed with axe-core Result/NodeResult types.
- npm typecheck: 0 errors. npm test: 21/21 pass.
- Blocked on: live DB needed for prisma migrate + seed. docker compose up required for task 7 completion.
- Affects shared files: package.json (workspace globs + scripts updated), packages/db/package.json (tsx dep), packages/queue/package.json (@gigw/crawler dep added).

---

## 2026-08-21 (lint + format pass) — Member A
- Fixed all 19 lint errors surfaced when lint was first run: added typescript-eslint unified package, added "type":"module" to root package.json, updated naming-convention rule to allow UPPER_CASE for constants, replaced JSX.Element with React.JSX.Element in all 3 dashboard components, fixed async-without-await in API health route, removed unnecessary optional chains in POST /jobs handler, fixed number-in-template-literal in crawler.
- Auto-formatted all 25 source files with Prettier.
- Final state: typecheck 0 errors, lint 0 errors, format:check clean, 21/21 tests pass.
- Task 7 (prisma migrate + seed): Docker not installed on this machine. All artifacts ready (schema.prisma, seed.ts, tsx runner). Run `docker compose up -d` then `npm run db:migrate && npm run db:seed` from packages/db when Docker is available.
- Phase 1 statically-verifiable exit criteria: all pass. DB-dependent criteria deferred.
- Affects shared files: package.json (type:module, typescript-eslint dep), eslint.config.js (naming rule).

---

## 2026-08-21 (CI hardening + lint clean) — Member A
- Root cause of 24 lint errors identified: two issues, not 24 bugs.
  1. Prisma client not generated → prisma.* types were `any` → downstream unsafe-any errors in api, crawler, db. Fixed by adding `postinstall: npm run db:generate` to root package.json so `npm ci` always generates the client.
  2. `noUncheckedIndexedAccess: true` + `Record<Severity, number>` indexed lookup → weight typed as `number | undefined`. Fixed with `(config.weights as Record<string, number>)[result.severity] ?? 1`.
  3. axe-core.ts: `AXE_RULE_MAP[id]` lookups and `Object.entries(AXE_RULE_MAP)` destructured value needed explicit type annotations to satisfy no-unsafe-assignment under strictTypeChecked.
- Fixed CI order: `npm ci` → `prisma generate` (via postinstall) → `build` → `format:check` → `lint` → `typecheck` → `test`. Previously lint ran before build, meaning @gigw/db dist types were absent.
- Added root `db:generate` convenience script: `npm run db:generate --workspace=@gigw/db`.
- Final state: typecheck 0 errors, lint 0 errors, format clean, 21/21 tests pass.
- Affects shared files: package.json (postinstall + db:generate scripts), .github/workflows/ci.yml (step order + build step added).

---

## 2026-08-21 (Phase 1 exit) — Member A
- Docker Desktop installed. Brought up postgres:16 + redis:7 containers.
- Ran `prisma migrate dev --name init` — migration applied, all tables created.
- Fixed seed.ts: removed `severity` field (belongs on CheckerResult, not ClauseDefinition). Re-ran seed — 97 rows inserted across quality(25), accessibility(50), cybersecurity(12), lifecycle(10). Counts verified via DB queries.
- Fixed two bugs discovered during PoC run: (1) crawler and axe-core checker were using `browser.newPage()` directly — axe-core/playwright requires pages created from a `browser.newContext()`. Fixed in crawler.ts. (2) `india.gov.in` and `www.india.gov.in` block headless Chromium (WAF/bot protection). Selected `uidai.gov.in` as the PoC target instead.
- A-008 COMPLETE: axe-core checker ran against `uidai.gov.in` and returned 15 real CheckerResult objects (11 pass, 1 fail, 2 needs_review, 1 not_applicable). Real failure: clause 5.2.49 — button without accessible text (`.mui-1ig7sdw`). All shapes valid. No exceptions.
- Updated docker-compose.yml: removed obsolete `version: "3.9"` attribute.
- Phase 1 exit criteria — all statically-verifiable pass: typecheck 0 errors, lint 0 errors, format clean, 21/21 tests. DB-dependent criteria all complete.
- Phase 1 COMPLETE. Ready to start Phase 2.
- Next: A-009/A-010 — build all §5.2 semi-automatable checkers (16 checker files).
- Note for crawler: many .gov.in sites have bot protection. The crawler should use a realistic user-agent string (set in BrowserContext options) and `domcontentloaded` instead of `networkidle` for the wait condition.
