
# Brain Log — Member B

Append-only. Never edit past entries. See rules.md for format.

---

## 2026-09-16 — Member B

- Read all planning docs and Member A's full brain log. Phase 1 is complete on A's side: crawler, BullMQ wiring, Fastify API, Prisma schema + migrations, DB seed (88 ClauseDefinition rows), and axe-core PoC all done. Docker is live.
- Key infrastructure notes absorbed: pages must be created via `browser.newContext()` not `browser.newPage()`; many .gov.in sites block headless Chromium — use realistic user-agent + `domcontentloaded`; `@gigw/db` is the single import point for all Prisma types.
- Populated tasks/member-b.md with B-001 through B-014 spanning Phase 1 (aggregation + PoC) through Phase 5 (tuning).
- Phase 1 B-side work starts now: B-003 (aggregation) and B-004 (quality-lifecycle PoC). Aggregation is unblocked — scoring formula and DB types already exist. PoC target: official-domain.ts (5.1.1) + metadata.ts (5.1.21) as they are fully automatable from HTML alone.
- Decided to implement `buildPageReport` and `buildSiteReport` in aggregation before writing checkers — this way checkers can be tested against the full pipeline immediately.
- Affects shared files: none yet.

---

## 2026-09-16 (Phase 1 implementation) — Member B

- Implemented aggregation service (B-003): `buildPageReportData`, `computeSectionScores`, `buildSiteReportData` (pure, no DB), `persistSiteReport` (Prisma transaction — creates SiteReport + PageReport rows, connects existing CheckerResult rows, sets CrawlJob status to done), `aggregateJob` (high-level entry point for the CHECK_QUEUE worker).
- Key fix: `noUncheckedIndexedAccess` + `Record<ClauseCategory, ResultSlice[]>` indexed reads were `T | undefined`. Resolved by replacing the Record bucket pattern with four explicit typed arrays — no runtime change, satisfies the compiler cleanly.
- Key fix: `prisma.$transaction` callback type extracted via `Parameters<Parameters<typeof prisma.$transaction>[0]>[0]` to type `tx` without importing the `Prisma` namespace (which isn't re-exported from `@gigw/db`).
- Key fix: `pages.length === 0 ? 100 : ...` flagged as unnecessary-condition by typescript-eslint strictTypeChecked. Replaced with `pages.length > 0 ? ... : 100` — identical runtime behaviour, satisfies the lint rule.
- Implemented quality-lifecycle PoC checkers (B-004): `official-domain.ts` (5.1.1 — .gov.in/.nic.in domain check, severity high) and `metadata.ts` (5.1.21 — page title + meta description + meta keywords, severity medium, 3 results per page). Both registered in index.ts.
- Key fix: `async run()` with no `await` flagged by require-await. Converted to synchronous `run()` returning `Promise.resolve(...)` — matches the `CheckerFn` return type contract.
- 13 aggregation unit tests + 10 checker unit tests written. Total: 44/44 pass, 0 lint errors, 0 typecheck errors.
- Phase 1 B-side complete. Next: B-005 (§5.1 full automatable checker set) and B-006 (§5.1 semi-automatable).
- Affects shared files: none.

---

## 2026-09-16 (Phase 1 exit) — Member B

- Ran quality-lifecycle PoC (scripts/poc-quality-lifecycle.ts) against uidai.gov.in — same target used by Member A for axe-core PoC.
- Site redirected https://uidai.gov.in/ → https://uidai.gov.in/en (551,714 bytes). Both checkers handled the redirect transparently (page.url() captures the final URL).
- 4 real CheckerResult objects returned, all shapes valid:
  - 5.1.1 official-domain: PASS (high) — uidai.gov.in ends with .gov.in ✓
  - 5.1.21 page-title: PASS (medium) — "Home - Unique Identification Authority of India | Government of India" ✓
  - 5.1.21 meta-description: PASS (medium) — UIDAI mandate description present ✓
  - 5.1.21 meta-keywords: PASS (medium) — rich keyword list present ✓
- Phase 1 B-side exit criteria met: at least one working checker returning real CheckerResults from a real .gov.in site.
- Phase 1 COMPLETE for Member B.
- Next: Phase 2 — B-005 (§5.1 full automatable checker set) when ready to resume.
- Note: uidai.gov.in is a well-maintained site — it passes everything. For Phase 2 testing, find a less-maintained .gov.in site to surface real failures. Check state government portals (e.g. state PWDs) rather than central ministry sites.
- Affects shared files: none.

---

## 2026-09-16 (testing pass) — Member B

- Ran full test suite with --reporter=verbose. Initial run: 44/44 pass. After adding edge cases: 71/71 pass (+ 7 skipped DB integration tests).
- Added 27 new edge case tests across 3 test files:
  - officialDomainChecker (+5): spoofed hostname (gov.in.malicious.com → fail), result count, CheckerResult shape, evidence content, deeply nested .nic.in subdomain.
  - metadataChecker (+6): whitespace-only title fails, empty content attr fails, no head tag fails all three, correct pageUrl/clauseId, detail.value populated on pass, detail.value null vs "" distinction on fail.
  - buildPageReportData (+6): weighted score maths (1 high fail+1 low pass=25, 2 medium mixed=50, 2 high pass+1 low fail=86), single pass=100, single fail=0, pageUrl filter on returned results.
  - computeSectionScores (+4): mixed pass/fail weighted score within one section (75), independent sections, not_applicable excluded from denominator, all-four-sections all-fail.
  - buildSiteReportData (+6): rounding (100+100+0=67, 100+50+0=50), section scores wired from allResults, section scores independent of page scores, totalRoutes fields, pages array preserved.
- One test needed correction: "detail.value is null on fail" — title tag present but whitespace-only produces value="" (empty string), not null; only fully absent meta tags produce null. Fixed assertion and updated test name to document the distinction.
- Wrote aggregation.integration.test.ts (persistSiteReport + aggregateJob, 7 tests). Uses describe.skip guard when DATABASE_URL is not set — safe for CI. Tests cover: SiteReport field values, PageReport FK linkage, CheckerResult connection, CrawlJob status transition to done, aggregateJob end-to-end. Ready to run once `docker compose up -d` + `db:migrate` + `db:seed` are done.
- Docker not installed on this machine — DB integration tests deferred, same as Member A's situation.
- Affects shared files: none.

---

## Merge note

- Ready to continue development.
