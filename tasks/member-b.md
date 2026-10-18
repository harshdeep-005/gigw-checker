
# Tasks — Member B

See rules.md for the task entry format and ID convention.

Task IDs are permanent — never reuse or renumber.

---

### [B-001] Read and verify all planning docs
Status: done
Date: 2026-09-16
Depends on: —
Notes: Read requirements.md, design.md, schema.md, implementationPlan.md, rules.md, README.md. Verified Member A's brain log and task list to understand shared infrastructure state. Phase 1 is complete on A's side — crawler, queue, API, Prisma schema, seed, axe-core PoC all done. DB is live (Docker). Ready to start Phase 1 B-side work.

---

### [B-002] Populate tasks/member-b.md with initial task list
Status: done
Date: 2026-09-16
Depends on: B-001
Notes: This file.

---

### [B-003] Implement aggregation service — buildPageReport + buildSiteReport
Status: done
Date: 2026-09-16
Depends on: B-001
Notes: Phase 1. Implement packages/aggregation/src/index.ts — buildPageReport(pageUrl, results) and buildSiteReport(job, pageReports) with DB persistence via @gigw/db prisma client. Score by section using ClauseCategory. Add unit tests alongside scoring.test.ts.

---

### [B-004] Quality-lifecycle checker PoC — domain + metadata checks (§5.1)
Status: done
Date: 2026-09-16
Depends on: B-001
Notes: Phase 1 exit criteria. official-domain.ts (5.1.1) and metadata.ts (5.1.21) implemented and verified live against uidai.gov.in. 4 real CheckerResult objects returned, all shapes valid (1 domain pass + 3 metadata passes). Phase 1 B-side complete.

---

### [B-005] Build §5.1 automatable checkers — full set
Status: todo
Date: 2026-09-16
Depends on: B-004
Notes: Phase 2. Clauses: 5.1.1 (official domain), 5.1.5 (contact page link), 5.1.6 (about page link), 5.1.7 (national portal link — india.gov.in), 5.1.18 (responsive/mobile — viewport meta), 5.1.21 (metadata: title + description + keywords), 5.1.22 (no prohibited content patterns). One file per clause-group, each registered in quality-lifecycle/src/index.ts.

---

### [B-006] Build §5.1 semi-automatable checkers
Status: todo
Date: 2026-09-16
Depends on: B-005
Notes: Phase 2. Clauses: 5.1.2 (state emblem/logo present — image heuristic), 5.1.3 (ownership info — text presence), 5.1.4 (content freshness — date element detection), 5.1.8 (social media links), 5.1.9 (feedback mechanism), 5.1.10 (search functionality), 5.1.11 (sitemap link), 5.1.12 (accessibility statement link), 5.1.13 (grievance officer info). Semi-automatable means heuristic detection with needs_review fallback.

---

### [B-007] Build §5.4 lifecycle checkers — automatable
Status: todo
Date: 2026-09-16
Depends on: B-004
Notes: Phase 2. Clauses: 5.4.1 (no broken links — HTTP status check on all anchor hrefs), 5.4.2 (no "under construction" pages — text heuristic), 5.4.3 (bilingual: Hindi + English selector or lang attribute), 5.4.4 (Unicode-compliant text — charset meta + font heuristic).

---

### [B-008] Build §5.4 lifecycle checkers — semi-automatable
Status: todo
Date: 2026-09-16
Depends on: B-007
Notes: Phase 2. Clauses: 5.4.5 (WIM contact details present), 5.4.6 (hyperlink accuracy — text vs href mismatch heuristic), 5.4.7 (multi-language content sync — same nav structure in both languages), 5.4.9 (content toxicity heuristic — keyword scan). needs_review for anything requiring human judgement.

---

### [B-009] Build quality-lifecycle dashboard view
Status: todo
Date: 2026-09-16
Depends on: B-005, B-006, B-007, B-008
Notes: Phase 2. Populate apps/dashboard/src/quality-lifecycle/ — section score card, clause-by-clause breakdown table, manual-review items list. Mirror accessibility view structure once A's view is available.

---

### [B-010] Wire aggregation into the full pipeline
Status: todo
Date: 2026-09-16
Depends on: B-003, B-005, B-006, B-007, B-008
Notes: Phase 3. Called from the CHECK_QUEUE worker after all checker results are written. buildSiteReport persists to DB; API GET /reports/:id returns the populated SiteReport. Coordinate with A on integration week.

---

### [B-011] Unit tests — aggregation
Status: done
Date: 2026-09-16
Depends on: B-003
Notes: Phase 2. Test buildPageReport and buildSiteReport with mock CheckerResult arrays. Cover: mixed severities, all-pass, all-fail, section score split, empty pages, manual-review separation.

---

### [B-012] Unit tests — quality-lifecycle checkers
Status: todo
Date: 2026-09-16
Depends on: B-005, B-006, B-007, B-008
Notes: Phase 2. Mock CheckerContext (html string, mock page). Test each checker with synthetic HTML that exercises pass, fail, and needs_review paths.

---

### [B-013] Integration testing — B's checkers end-to-end against real .gov.in sites
Status: todo
Date: 2026-09-16
Depends on: B-005, B-006, B-007, B-008, B-010
Notes: Phase 3. Run full pipeline: crawl → quality+lifecycle checks → aggregate → dashboard. Log false positives/negatives in brain/member-b.md. Coordinate with A-015.

---

### [B-014] Tune scoring thresholds and manual-review checklist UI
Status: todo
Date: 2026-09-16
Depends on: B-013
Notes: Phase 4+5. Adjust severity weights if Phase 3 results look skewed. Wire manual-review items (needs_review results) into a separate checklist section in the dashboard (requirements.md §1.5).
