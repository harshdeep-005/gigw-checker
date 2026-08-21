# design.md — System Architecture

**Mostly frozen after Week 2.** Describes *how* the system is built. For
*what* it must check, see `requirements.md`. For data shapes, see `schema.md`.

---

## 1. High-level architecture

```
                        ┌─────────────────────┐
   User enters URL ───▶ │   API (Fastify)      │
                        └─────────┬───────────┘
                                  │ enqueues job
                                  ▼
                        ┌─────────────────────┐
                        │  Job Queue (BullMQ)  │◀── Redis
                        └─────────┬───────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                        ▼
   ┌─────────────────────┐                  ┌─────────────────────┐
   │  Crawler (Playwright) │──discovers──▶  │   Route table (DB)   │
   └─────────┬───────────┘                  └─────────────────────┘
              │ for each discovered route, enqueue a check-job
              ▼
   ┌───────────────────────────────────────────────────────────┐
   │              Checker Engine (Playwright + axe-core)         │
   │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
   │  │ Quality (C)    │ │ Accessibility(A)│ │ Cybersecurity(B)│  │
   │  │ + Lifecycle (C)│ │  checkers      │ │  checkers      │    │
   │  └───────────────┘ └───────────────┘ └───────────────┘    │
   └───────────────────────────┬───────────────────────────────┘
                                │ CheckerResult[] per page
                                ▼
                     ┌─────────────────────┐
                     │  PostgreSQL (Prisma)  │
                     │  routes, results,      │
                     │  clauses, reports       │
                     └─────────┬───────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Aggregation service   │
                     │  (scoring, per schema) │
                     └─────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌─────────────────┐     ┌─────────────────────┐
         │ Dashboard (React) │     │ PDF Report (Playwright│
         │                   │     │  print-to-PDF)         │
         └─────────────────┘     └─────────────────────┘
```

---

## 2. Component responsibilities

| Component | Responsibility | Owner |
|---|---|---|
| **API** | Accept a site URL, validate it, create a crawl job, expose endpoints for polling status + fetching `SiteReport` | Shared scaffolding (built together, Week 1-2) |
| **Crawler** | BFS/DFS crawl from seed URL, same-domain only, respects `robots.txt`, depth-capped, writes discovered `Route`s to DB | Shared scaffolding, then Member A extends for edge cases (auth walls, infinite scroll) |
| **Job Queue** | Decouples crawl + check work from HTTP request/response; retries failed page loads | Shared scaffolding |
| **Checker Engine** | Runs all applicable `CheckerModule`s against a rendered page, collects `CheckerResult[]` | Each member plugs in their own domain's checkers against the shared `Checker` interface (`schema.md` §3) |
| **Aggregation service** | Computes `PageReport` and `SiteReport` from raw `CheckerResult`s per the scoring formula | Member C (owns scoring logic as part of Quality/Lifecycle domain) initially, reviewed by all |
| **Dashboard** | Site-wide + per-page score visualization, manual-review checklist, drill-down by clause | Shared shell (Week 1-2), then each member adds their domain's result-visualization component |
| **PDF Report** | Renders a report page, prints to PDF via Playwright | Shared scaffolding |

---

## 3. Monorepo folder structure

```
gigw-checker/
├── rules.md
├── schema.md
├── design.md
├── requirements.md
├── implementationPlan.md
├── brain/
│   ├── member-a.md
│   ├── member-b.md
│   └── member-c.md
├── tasks/
│   ├── member-a.md
│   ├── member-b.md
│   └── member-c.md
├── packages/
│   ├── crawler/              # shared
│   ├── queue/                # shared
│   ├── api/                  # shared
│   ├── db/                   # Prisma schema + migrations, shared
│   ├── checkers/
│   │   ├── accessibility/    # Member A
│   │   ├── cybersecurity/    # Member B
│   │   └── quality-lifecycle/ # Member C
│   ├── aggregation/          # Member C initially, shared review
│   └── report-pdf/           # shared
├── apps/
│   └── dashboard/
│       ├── shell/            # shared nav, layout, routing
│       ├── accessibility/    # Member A's view components
│       ├── cybersecurity/    # Member B's view components
│       └── quality-lifecycle/ # Member C's view components
└── docker-compose.yml
```

This mirrors the vertical-slice ownership from `implementationPlan.md`:
each member's checker package and dashboard package live in clearly
separate folders, minimizing file-level git conflicts.

---

## 4. Key technical decisions

- **Playwright over Cheerio/axios+jsdom:** most `.gov.in` sites render
  content via JS; a static HTTP fetch would miss content and give false
  "missing content" failures.
- **axe-core over building custom WCAG checks:** avoids reinventing
  well-tested accessibility logic; frees Member A's time for GIGW-specific
  criteria axe-core doesn't cover out of the box.
- **BullMQ/Redis over synchronous checking:** a full-site crawl + check run
  can take minutes to hours depending on site size — must not block API
  requests.
- **PostgreSQL + Prisma over MongoDB:** the data is inherently relational
  (routes → results → clauses → reports); Prisma also generates TS types
  matching `schema.md`, reducing manual type-sync work.
- **Monorepo:** all three members' domains, shared scaffolding, and
  planning docs live in one repo — simpler dependency management for a
  3-person team, and `schema.md`/`brain/`/`tasks/` are naturally visible
  to everyone without cross-repo lookups.

---

## 5. Cybersecurity checker constraint — passive only

Member B's checker package (`packages/checkers/cybersecurity/`) must only
perform passive inspection: HTTP headers, TLS/certificate handshake info,
cookie flags, and observing a natural 404 page. **No active
scanning/exploit techniques of any kind** (no admin-path probing, no
injection payloads, no auth brute-forcing) — this is a legal boundary, not
a style preference. Full reasoning and the exact allow/disallow list is in
`requirements.md` §7 — read it before writing any code in this package.

## 6. Crawl scope decision (finalize in Week 1-2 team session)

- Same-domain only, respects `robots.txt`
- Default depth cap: 5 (configurable per run)
- Default page cap: 500 (configurable — some ministry sites are huge)
- Timeout per page: 15s, 2 retries before marking `error`
