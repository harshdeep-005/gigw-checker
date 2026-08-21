# schema.md — Data Contracts (v1.1)

**This file is frozen after Week 1.** Any change requires human review and
a version bump (see §7). These are the shapes every checker, the API, and
the dashboard agree to use — this is what lets three people build in
isolation without touching each other's files.

---

## 1. `ClauseDefinition`

One entry per GIGW 3.0 clause, sourced from `requirements.md`'s clause table.

```typescript
type ClauseCategory = "quality" | "accessibility" | "cybersecurity" | "lifecycle";
type ClauseAutomation = "automatable" | "semi-automatable" | "manual-only";

interface ClauseDefinition {
  clauseId: string;          // e.g. "5.1.7" or "Q-DOMAIN-01" if GIGW doesn't number cleanly
  section: ClauseCategory;
  title: string;              // short human label, e.g. "Official domain usage"
  description: string;        // paraphrased guideline text
  automation: ClauseAutomation;
  ownerMember: "A" | "B" | "C";
  checkerId: string | null;   // links to a CheckerModule; null if manual-only
}
```

---

## 2. `CheckerResult`

The output every checker function must return, per page, per clause.

```typescript
type CheckStatus = "pass" | "fail" | "needs_review" | "not_applicable";
type Severity = "high" | "medium" | "low"; // per requirements.md §3 — team-assigned heuristic, not an official GIGW matrix (see §3's honesty note)

interface CheckerResult {
  clauseId: string;           // must match a ClauseDefinition.clauseId
  pageUrl: string;
  status: CheckStatus;
  severity: Severity;
  evidence: string;           // short human-readable reason, e.g. "Missing <meta name='description'>"
  detail?: Record<string, unknown>; // optional structured extra data (e.g. axe-core raw violation)
  checkedAt: string;          // ISO 8601 timestamp
}
```

## 3. `Checker` interface

Every checker function, regardless of who writes it, must implement:

```typescript
interface CheckerContext {
  page: Page;         // Playwright Page object, already navigated to the URL
  pageUrl: string;
  html: string;        // rendered HTML snapshot
}

type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResult[]>;

interface CheckerModule {
  checkerId: string;          // unique, e.g. "a11y-contrast"
  clauseIds: string[];        // which ClauseDefinition(s) this checker covers
  run: CheckerFn;
}
```

A checker may return results for multiple clauses (e.g. one axe-core pass
covers several accessibility clauses at once).

---

## 4. `Route` / crawl output

```typescript
interface Route {
  url: string;
  depth: number;
  discoveredFrom: string | null; // parent URL, null for the seed/homepage
  status: "pending" | "crawled" | "error" | "skipped";
  httpStatus?: number;
  crawledAt?: string;
}
```

---

## 5. `PageReport` (aggregated per page)

```typescript
interface PageReport {
  pageUrl: string;
  results: CheckerResult[];
  score: number;              // 0-100, weighted by severity — see §6
  summary: {
    pass: number;
    fail: number;
    needsReview: number;
    notApplicable: number;
  };
}
```

## 6. `SiteReport` (aggregated whole-site result — the final deliverable)

```typescript
interface SiteReport {
  siteUrl: string;
  crawlStartedAt: string;
  crawlFinishedAt: string;
  totalRoutesDiscovered: number;
  totalRoutesChecked: number;
  overallScore: number;       // 0-100
  scoreBySection: Record<ClauseCategory, number>;
  pages: PageReport[];
  manualReviewItems: CheckerResult[]; // status === "needs_review" or clause.automation === "manual-only"
}
```

**Scoring formula (initial, tunable):**
```
severityWeight = { high: 3, medium: 2, low: 1 }
pageScore = 100 * (sum of passed clause weights) / (sum of all applicable clause weights)
overallScore = average of pageScore across all crawled pages
```
This is a starting formula — if week-1 discussion decides the GIGW risk
matrix should weight differently, this section gets updated and version-bumped.

---

## 7. Versioning

- Current version: **v1.1**
- Any change to a type above → bump to v1.1, v1.2, etc.
- Log every version bump at the bottom of this file with date + reason.
- Agents blocked by a pending schema change note it in their own `brain/`
  file, referencing the version they need (e.g. "Blocked on schema.md v1.1 —
  need `severity` field").

### Version log
- **v1.0** — 2026-08-21 — initial contract.
- **v1.1** — 2026-08-21 — clarified that `Severity` values are a team-assigned
  heuristic (requirements.md §3), not a transcription of GIGW's official
  risk matrix; corrected the stale section cross-reference.
