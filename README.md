# GIGW 3.0 Compliance Checker

An automated tool to audit Indian government websites against the
Guidelines for Indian Government Websites and Apps (GIGW 3.0) — crawling
a site's routes and checking them against Quality, Accessibility,
Cybersecurity, and Lifecycle Management guidelines.

## Start here

Before touching any code, read (in this order):
1. `rules.md` — agent/contributor conventions
2. `schema.md` — data contracts
3. `design.md` — system architecture
4. `requirements.md` — full GIGW clause coverage table
5. `implementationPlan.md` — timeline and phases
6. `brain/` — running decision log per member
7. `tasks/` — your own task list

## Team

- Member A — Accessibility (§5.2) + Cybersecurity (§5.3)
- Member B — Quality (§5.1) + Lifecycle (§5.4)

## Status

Phase 1 complete (2026-08-21). Phase 2 (checker development) in progress.
See tasks/member-a.md and tasks/member-b.md for current task state.

## Getting started

**Prerequisites:** Node.js 20+, Docker Desktop

```bash
# 1. Clone and install
git clone <repo-url>
cd gigw-checker
npm ci                        # also runs prisma generate via postinstall

# 2. Start postgres + redis
docker compose up -d postgres redis

# 3. Run DB migration and seed
cd packages/db
DATABASE_URL=postgres://gigw:gigw@localhost:5432/gigw_checker npm run db:migrate
DATABASE_URL=postgres://gigw:gigw@localhost:5432/gigw_checker npm run db:seed
cd ../..

# 4. Verify everything works
npm run typecheck             # 0 errors
npm test                      # all pass
npm run lint                  # 0 errors
```

**Member A** owns `packages/checkers/accessibility/` and `packages/checkers/cybersecurity/`.
**Member B** owns `packages/checkers/quality-lifecycle/` and `packages/aggregation/`.
Shared packages: `packages/crawler/`, `packages/queue/`, `packages/api/`, `packages/db/`, `apps/dashboard/`.

Before writing any code, read: `rules.md` → `schema.md` → `design.md` → `requirements.md`.

