# implementationPlan.md — Timeline & Phases

Covers *when* things happen. For *what* and *how*, see `requirements.md`
and `design.md`. Team: 3 members (A: Accessibility, B: Cybersecurity,
C: Quality + Lifecycle). Duration: 6 months (~26 weeks).

---

## Phase 0 — Weeks 1-2: Requirements mapping & scaffolding decisions

**Together, all 3 members:**
- Obtain full GIGW 3.0 PDF; expand clause tables for 5.2/5.3/5.4 in
  `requirements.md` (currently flagged TODO)
- Finalize crawl scope decision (`design.md` §5)
- Finalize scoring formula (`schema.md` §6)
- Freeze `schema.md` v1.0
- Set up monorepo, `docker-compose.yml`, CI skeleton (lint + test on PR)
- Create `brain/` and `tasks/` folders with empty member files

**Exit criteria:** `schema.md` frozen, full clause table exists for all 4
sections, repo runs locally via `docker compose up`.

---

## Phase 1 — Weeks 3-6: Core infra

- **Shared (all 3):** crawler core (BFS/DFS, robots.txt, depth/page cap),
  BullMQ job wiring, Fastify API skeleton, Prisma schema + migrations,
  dashboard shell (nav, routing, layout, no real data yet — mock `SiteReport`)
- **Member A:** scaffold `packages/checkers/accessibility/`, get axe-core
  running inside a Playwright page as a proof of concept
- **Member B:** scaffold `packages/checkers/cybersecurity/`, get header/TLS
  inspection working as a proof of concept
- **Member C:** scaffold `packages/checkers/quality-lifecycle/`, get domain
  + metadata checks working as a proof of concept

**Exit criteria:** crawler can discover routes on a real site; each member
has at least one working checker returning real `CheckerResult`s.

---

## Phase 2 — Weeks 7-14: Checker development (main build phase)

- **Member A:** build out all Section 5.2 checkers per the clause table,
  wire axe-core results into `CheckerResult` format, build accessibility
  dashboard view
- **Member B:** build out all Section 5.3 checkers, wire OWASP-lite scan +
  header/TLS checks, build cybersecurity dashboard view
- **Member C:** build out all Section 5.1 + 5.4 checkers, build scoring/
  aggregation service (`packages/aggregation/`), build quality/lifecycle
  dashboard view

Each member updates their `tasks/member-{x}.md` continuously with task IDs;
`brain/member-{x}.md` gets an entry after each meaningful decision.

**Exit criteria:** every `automatable` and `semi-automatable` clause in
`requirements.md` has a working checker.

---

## Phase 3 — Weeks 15-16: Integration Week #1

**Together:** connect crawler → checkers → aggregation → dashboard
end-to-end against one real test site. This is where schema mismatches
and integration bugs surface — expect this week to be disruptive, that's normal.

**Exit criteria:** a full site crawl produces a real `SiteReport` visible
in the dashboard, for at least one real government website.

---

## Phase 4 — Weeks 17-20: Reporting & manual-review flow

- Finalize weighted scoring model (tune based on Phase 3 results)
- Build PDF export (`packages/report-pdf/`)
- Build the manual-review checklist UI (clearly separated from automated
  pass/fail results, per `requirements.md` §1.5)
- Add re-check/re-run capability without full re-crawl

---

## Phase 5 — Weeks 21-22: Real-world testing

- Run against 3-5 real `.gov.in`/`.nic.in` sites of varying size
- Log false positives/negatives per checker in `brain/` entries
- Tune thresholds (contrast ratios, header requirements, date-freshness windows)

---

## Phase 6 — Weeks 23-24: Integration Week #2 + polish

- Bug fixes surfaced from Phase 5
- UI polish, error states (crawl failures, huge sites, non-English content)
- Performance pass on the queue/concurrency settings

---

## Phase 7 — Weeks 25-26: Documentation, report, demo prep

- Project report (can largely draw from `requirements.md` + `design.md`)
- Architecture diagram (from `design.md` §1, polished for presentation)
- Live demo script — pick 1-2 real sites to demo live, have a pre-run
  backup report in case of live-demo network issues
- Buffer for the unexpected (there's always something)

---

## Milestones summary

| Week | Milestone |
|---|---|
| 2 | Full clause table complete, schema frozen |
| 6 | Each member has one working checker end-to-end |
| 14 | All automatable/semi clauses have working checkers |
| 16 | First full end-to-end site report generated |
| 20 | PDF export + manual-review UI complete |
| 22 | Tested against multiple real sites |
| 24 | Feature-complete, polished |
| 26 | Demo-ready |
