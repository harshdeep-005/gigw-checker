# requirements.md — What Must Be Built

**Frozen-ish after Week 2.** This is the single source of truth for scope.
`design.md` covers *how*; this covers *what*.

> **v2 update:** rebuilt from the full GIGW 3.0 document (25 clauses in
> §5.1, 50 in §5.2, 3 top-level but deeply detailed clauses in §5.3, 10 in
> §5.4). The earlier version of this file scaffolded placeholders for
> 5.2-5.4 assuming only a summary was available — that assumption was
> wrong; the full text was already present. Clause IDs now match the
> document's own numbering (`5.1.1`, `5.2.14`, etc.) instead of the
> invented `Q-01`/`A-01` scheme from v1.
>
> **New constraint surfaced while building this (read §6 below):** a
> meaningful chunk of §5.3 (Cybersecurity) describes internal
> server/code/hosting practices that are **not observable by crawling a
> public site** at all — and a few items, if "checked" naively (e.g.
> probing for hidden admin panels, testing directory traversal), would
> cross from passive auditing into active security testing. Doing that
> against live government sites without authorization is a real legal
> issue (unauthorized access under the IT Act), not just a scope
> question. §6 draws this line explicitly — read it before anyone builds
> a Section 5.3 checker.

---

## 0. Terminology note

The clause tables below use `automatable` / `semi` / `manual-only` as
shorthand for readability. When seeding `ClauseDefinition` rows (per
`schema.md` §1), `semi` maps to the schema's `"semi-automatable"` enum
value — the tables aren't using a different vocabulary, just a shorter
label for the same three categories.

## 1. Functional requirements

1. Accept a single seed URL and crawl the site, same-domain, depth- and
   page-capped (see `design.md` §5).
2. For every discovered route, run all applicable checkers and produce a
   `CheckerResult[]` (per `schema.md` §2).
3. Aggregate results into a `PageReport` per route and a `SiteReport` for
   the whole site (per `schema.md` §5-6).
4. Present results in a dashboard: overall score, score by GIGW section,
   drill-down to individual clause failures with evidence.
5. Flag all `manual-only` clauses and `needs_review` results in a distinct,
   clearly separated checklist — never silently mix these with pass/fail results.
6. Export the full report as a downloadable PDF.
7. Allow re-running a check on a previously crawled site without re-crawling
   from scratch (cache routes, allow "recheck" as a separate action).

## 2. Non-functional requirements

- Crawl + check a mid-sized site (~100-200 pages) within a reasonable demo
  timeframe (target: under 15 minutes) — tune concurrency in the queue accordingly.
- Handle crawl failures gracefully (timeouts, 404s, redirect loops) without
  crashing the whole job.
- Dashboard must itself be reasonably accessible (basic keyboard nav, alt
  text) — a compliance tool with an inaccessible UI undermines its own point.
- All scoring/checker logic must be unit-testable independent of a live
  browser session where possible (mock `CheckerContext`).

## 3. Severity / Risk Weighting Methodology

**Honesty note:** the source GIGW 3.0 document references a detailed
official matrix (Annexure II) mapping every guideline to specific risks
(Q1-Q10, A1-A9, S1-S15 from §4 of the source doc) — but the matrix itself
isn't reproduced in the text this project has access to, only a mention
that it exists. So the `Severity` column in every clause table below is
**this team's first-pass judgment**, not a transcription of an official
weighting. Treat it as a default to sanity-check and tune during Week 1-2
planning (`implementationPlan.md` Phase 0), not as settled fact.

**Assignment heuristic used:**
- **high** — non-conformity would fully block a class of users from
  accessing content/services (e.g. no keyboard access, no text alternative
  for screen readers), creates real legal/security exposure (copyright
  permissions, TLS/encryption gaps, an unofficial domain undermining
  authenticity), or directly matches a Q/A/S risk in the source document's
  §4 risk lists that reads as severe.
- **medium** — degrades usability, trust, or accessibility for some users
  but doesn't fully block access or create legal exposure (e.g. missing
  consistent navigation, unclear link text, incomplete metadata).
- **low** — cosmetic, informational, or minor UX polish (e.g. spelling
  errors, missing social media integration, print-layout imperfections).

This feeds the scoring formula in `schema.md` §6
(`severityWeight = { high: 3, medium: 2, low: 1 }`).

## 4. GIGW 3.0 Clause Coverage Table — Section 5.1 (Quality) — 25 clauses

| Clause ID | Title | Automation | Severity | Owner | Notes |
|---|---|---|---|---|---|
| 5.1.1 | State Emblem/logo on homepage, proper ratio/colour, alt text | semi | medium | C | logo presence + alt-text check automatable; correct ratio/colour needs visual/manual check |
| 5.1.2 | Ownership info on homepage + entry pages | automatable | medium | C | text/footer presence check |
| 5.1.3 | Source cited for reproduced documents | manual-only | low | C | requires knowing provenance of content, not observable from page alone |
| 5.1.4 | Due permission obtained for copyrighted content | manual-only | high | C | organizational fact |
| 5.1.5 | Last updated/reviewed date shown | automatable | low | C | date-pattern detection near footer/header |
| 5.1.6 | Downloadable material: title, size, format, instructions | semi | low | C | presence of metadata text automatable; accuracy manual |
| 5.1.7 | Circulars/notifications/forms/schemes: title, language, purpose, validity listed | semi | medium | C | structured field presence automatable; completeness/accuracy manual |
| 5.1.8 | Outdated content removed or archived | semi | medium | C | can flag stale-dated items past a threshold; true archival-policy compliance manual |
| 5.1.9 | "About Us" section present and current | semi | low | C | presence automatable; "kept up to date" manual |
| 5.1.10 | "Contact Us" page with complete details, linked from homepage | automatable | medium | C | link + content presence check |
| 5.1.11 | Feedback collected via online forms, timely response process | semi | low | C | form presence automatable; "timely response" manual |
| 5.1.12 | Prominent link to National Portal (india.gov.in), opens in new window | automatable | low | C | link + `target="_blank"` check |
| 5.1.13 | Multi-browser tested; Hindi/regional fonts render without layout loss | manual-only | medium | C | requires actual cross-browser/font visual testing |
| 5.1.14 | Help section, linked from all pages, consistent location | semi | low | C | link presence per-page automatable; "consistent location" needs layout comparison |
| 5.1.15 | CSS-based layout + responsive design | automatable | medium | C | external stylesheet usage + viewport meta + media queries |
| 5.1.16 | Content readable with style sheets off | semi | medium | C | can render with CSS disabled and diff for lost content, but judging "readability" is partly manual |
| 5.1.17 | Page title, `lang` attribute, metadata (keywords/description) | automatable | medium | C | HTML head parsing |
| 5.1.18 | Minimum prescribed content on homepage + subsequent pages | automatable | high | C | checklist of required links/elements per §5.1.18 |
| 5.1.19 | Data table markup (row/column headers, associated cells) | automatable | medium | C | `<th>`, `scope`, `caption`, header association parsing |
| 5.1.20 | Content prints correctly on A4 | semi | low | C | `@media print` stylesheet presence automatable; visual correctness manual |
| 5.1.21 | Official domain (`.gov.in`/`.nic.in`, or `.edu.in`/`.res.in`/`.ac.in` for eligible institutions) | automatable | high | C | domain string check |
| 5.1.22 | API integration with India Portal, DigiLocker, Aadhaar, SSO, MyGov, MyScheme, Data Platform | semi | medium | C | presence of integration links/widgets only — functional integration can't be verified by crawling |
| 5.1.23 | Consistent UX/visual identity across the organisation's websites/apps | manual-only | low | C | requires comparing across multiple separate properties/organisational judgment |
| 5.1.24 | Two-way social media integration | automatable | low | C | link/widget/embed presence check |
| 5.1.25 | Content free from spelling/grammatical errors | semi | low | C | LanguageTool-style API gives heuristic flags, not authoritative judgment |

## 5. GIGW 3.0 Clause Coverage Table — Section 5.2 (Accessibility) — 50 clauses, WCAG 2.1 AA

Every clause maps directly to a WCAG 2.1 success criterion, which matters
a lot for automation: axe-core (and similar engines) has well-documented,
consistent coverage of WCAG rules, so classification below follows what
axe-core/automated DOM analysis can actually detect vs. what genuinely
needs a human (this is standard, widely-agreed-upon territory in
accessibility tooling — axe-core itself publishes what it can and can't catch).

| Clause ID | WCAG Ref | Title | Automation | Severity | Owner | Notes |
|---|---|---|---|---|---|---|
| 5.2.1 | 1.1.1 | Text alternatives for non-text content | semi | high | A | alt-attribute *presence* automatable; whether the alt text is *meaningful* is semi/manual |
| 5.2.2 | 1.2.1 | Alternative for prerecorded audio/video-only | manual-only | high | A | can detect `<audio>`/`<video>` presence, not whether a transcript exists elsewhere |
| 5.2.3 | 1.2.2 | Captions for prerecorded audio in sync media | semi | high | A | can check for `<track kind="captions">`; can't judge caption quality |
| 5.2.4 | 1.2.3 | Audio description or text alternative for video | manual-only | high | A | not detectable from markup alone |
| 5.2.5 | 1.2.4 | Captions for live audio | manual-only | high | A | requires live-event observation |
| 5.2.6 | 1.2.5 | Audio description for prerecorded video | manual-only | high | A | same as 5.2.4 |
| 5.2.7 | 1.3.1 | Info/relationships programmatically determinable | automatable | high | A | axe-core core rule set |
| 5.2.8 | 1.3.2 | Meaningful sequence | semi | medium | A | DOM order heuristics automatable; true "meaning" judgment is manual |
| 5.2.9 | 1.3.3 | Sensory characteristics not sole instruction method | manual-only | medium | A | requires reading instructional text for meaning |
| 5.2.10 | 1.3.4 | Orientation not restricted | semi | medium | A | CSS orientation-lock detection possible; "essential" exceptions need judgment |
| 5.2.11 | 1.3.5 | Identify input purpose (autofill) | automatable | medium | A | `autocomplete` attribute check |
| 5.2.12 | 1.4.1 | Use of colour (not sole indicator) | semi | medium | A | can flag colour-only cues heuristically; full judgment manual |
| 5.2.13 | 1.4.2 | Audio control (autoplay > 3s) | automatable | medium | A | detect autoplay audio/video + absence of pause control |
| 5.2.14 | 1.4.3 | Contrast minimum 4.5:1 | automatable | high | A | axe-core contrast checker |
| 5.2.15 | 1.4.4 | Resize text to 200% | semi | medium | A | relative-unit usage detectable; true no-loss-of-content needs visual check |
| 5.2.16 | 1.4.5 | Images of text avoided | semi | low | A | detectable via image OCR heuristics; exceptions need judgment |
| 5.2.17 | 1.4.10 | Reflow at 320px/256px | automatable | medium | A | render-and-measure at target viewport |
| 5.2.18 | 1.4.11 | Non-text contrast 3:1 | automatable | medium | A | axe-core rule |
| 5.2.19 | 1.4.12 | Text spacing overrides don't break content | semi | medium | A | can inject overrides and diff for lost content |
| 5.2.20 | 1.4.13 | Content on hover/focus dismissible/hoverable/persistent | manual-only | medium | A | requires interaction testing |
| 5.2.21 | 2.1.1 | Keyboard operable | semi | high | A | tab-order traversal automatable; full functional coverage needs manual pass |
| 5.2.22 | 2.1.2 | No keyboard trap | semi | high | A | automatable via scripted tab-through, imperfect |
| 5.2.23 | 2.1.4 | Character key shortcuts remappable/off | manual-only | medium | A | requires reading app behavior/docs |
| 5.2.24 | 2.2.1 | Timing adjustable | manual-only | medium | A | behavioral, not static-analyzable |
| 5.2.25 | 2.2.2 | Pause/stop/hide moving content | semi | medium | A | detect `<marquee>`, CSS animations, auto-carousels without controls |
| 5.2.26 | 2.3.1 | No content flashes >3×/second | semi | high | A | analyzable for video/gif frame rate, complex to implement |
| 5.2.27 | 2.4.1 | Bypass blocks (skip links) | automatable | medium | A | detect skip-to-content link pattern |
| 5.2.28 | 2.4.2 | Page titled | automatable | medium | A | `<title>` presence + non-generic check |
| 5.2.29 | 2.4.3 | Focus order preserves meaning | semi | medium | A | tab-order vs. DOM-order comparison, imperfect proxy |
| 5.2.30 | 2.4.4 | Link purpose from text/context | semi | medium | A | flag generic link text ("click here"); full judgment manual |
| 5.2.31 | 2.4.5 | Multiple ways to locate a page | automatable | medium | A | detect search box + sitemap presence |
| 5.2.32 | 2.4.6 | Headings/labels describe topic | semi | medium | A | heading hierarchy automatable; descriptiveness is manual |
| 5.2.33 | 2.4.7 | Focus visible | automatable | high | A | detect focus-style suppression (`outline: none` without replacement) |
| 5.2.34 | 2.5.1 | Pointer gestures have single-pointer alternative | manual-only | medium | A | requires interaction testing |
| 5.2.35 | 2.5.2 | Pointer cancellation | manual-only | medium | A | requires interaction testing |
| 5.2.36 | 2.5.3 | Label in name matches visible text | automatable | medium | A | axe-core rule |
| 5.2.37 | 2.5.4 | Motion actuation has UI alternative | manual-only | medium | A | requires device/sensor testing |
| 5.2.38 | 3.1.1 | Page language programmatically set | automatable | high | A | `lang` attribute check |
| 5.2.39 | 3.1.2 | Language of parts marked | semi | medium | A | detectable for tagged spans; comprehensive detection is hard |
| 5.2.40 | 3.2.1 | No context change on focus | manual-only | medium | A | behavioral |
| 5.2.41 | 3.2.2 | No unexpected context change on input | manual-only | medium | A | behavioral |
| 5.2.42 | 3.2.3 | Consistent navigation order | semi | medium | A | structural diffing across pages |
| 5.2.43 | 3.2.4 | Consistent identification of repeated components | semi | medium | A | structural/label diffing across pages |
| 5.2.44 | 3.3.1 | Input errors identified in text | semi | medium | A | detect error-message elements exist; correctness of messaging is manual |
| 5.2.45 | 3.3.2 | Labels/instructions for user input | automatable | high | A | `<label>`/`aria-label` association check |
| 5.2.46 | 3.3.3 | Error correction suggestions | manual-only | medium | A | content-quality judgment |
| 5.2.47 | 3.3.4 | Error prevention for legal/financial/data-modifying actions | manual-only | high | A | requires understanding page purpose/workflow |
| 5.2.48 | 4.1.1 | Valid markup (no duplicate IDs, proper nesting) | automatable | medium | A | HTML validator |
| 5.2.49 | 4.1.2 | Name, role, value programmatically determinable | automatable | high | A | axe-core ARIA rules |
| 5.2.50 | 4.1.3 | Status messages determinable without focus | semi | medium | A | detect ARIA live regions; correctness of use is manual |

## 6. GIGW 3.0 Clause Coverage Table — Section 5.3 (Cybersecurity) — 3 top-level clauses, extensively detailed

§5.3 is structured differently from 5.1/5.2: there are only 3 numbered
clauses, but each contains dozens of lettered sub-guidelines covering code,
database, hosting, and container security. Most of these describe
**server-side/internal practices that cannot be observed by crawling a
public-facing site** — flagged clearly below. See §6 for the legal/ethical
boundary on what's safe to actually test.

| Sub-clause | Title | Automation | Severity | Owner | Notes |
|---|---|---|---|---|---|
| 5.3.1 (top-level) | Security Audit Clearance certificate (NIC/STQC/CERT-In empanelled) | manual-only | high | B | external audit artifact, not derivable from the site itself |
| 5.3.1-code-headers | HTTP response headers obscured (no server/version disclosure) | automatable | medium | B | passive header inspection |
| 5.3.1-code-cookies | Cookies are Secure + HttpOnly | automatable | high | B | passive `Set-Cookie` header inspection |
| 5.3.1-code-errors | Custom error pages (no stack trace/source exposure) | semi | high | B | trigger a natural 404 (not exploit-style probing) and inspect response — see §7 boundary |
| 5.3.1-code-tls-comms | 3rd-party/API comms encrypted | semi | high | B | detectable only for calls visible in page network traffic |
| 5.3.1-code-mfa | MFA / password policy on login | manual-only | high | B | cannot verify without authenticated access |
| 5.3.1-code-* (remaining items: directory traversal, renamed default admin paths, root-user process, RBAC, secure coding checklist, logging) | — | manual-only | high | B | internal server/code configuration, not externally observable at all — **do not attempt to probe these actively (see §7)** |
| 5.3.1-db-* (all database security items) | — | manual-only | high | B | entirely internal, not observable externally under any circumstances |
| 5.3.2 (top-level) | Hosting environment secured (CIA) | manual-only | high | B | requires HSP/data-centre-level information not visible from the site |
| 5.3.2-tls | Valid SSL/TLS certificate, ≥2048-bit SHA-256 | automatable | high | B | certificate inspection |
| 5.3.2-https | HTTPS enforced, HTTP disabled, HSTS present | automatable | high | B | protocol + header check |
| 5.3.2-ciphers | Weak protocols/ciphers disabled (SSLv2/v3, 3DES, RC4, TLS 1.0/1.1) | automatable | high | B | TLS handshake capability scan (passive, standards-based — e.g. same approach as SSL Labs) |
| 5.3.2-waf | Web Application Firewall present | semi | medium | B | inferable from response headers/behavior patterns, not certain |
| 5.3.2-hosting-location, DR drills, container security, etc. | — | manual-only | medium | B | organisational/infrastructure facts, not observable via crawling |
| 5.3.3 | Security Policy, Privacy Policy, Contingency Plan defined & published | semi | medium | B | presence of policy *pages* automatable; whether they're actually approved/complete is manual |

## 7. Cybersecurity checking — scope boundary (read before building any 5.3 checker)

**What this tool may do (passive, non-intrusive):**
- Inspect HTTP response headers on normal requests
- Inspect TLS certificate and negotiated protocol/cipher on a standard handshake
- Check for HTTPS enforcement and HSTS
- Observe cookie flags on normal page loads
- Trigger a genuinely non-existent URL to see if a custom error page is shown (this is just visiting a page that doesn't exist — no different from a normal 404, not a probing technique)

**What this tool must NOT do, even if it would technically improve "detection":**
- Attempt to access known admin panel paths, config files, or backup files to see if they're exposed
- Attempt directory traversal, SQL injection, XSS payloads, or any OWASP Top 10 exploit technique
- Run active vulnerability scanners (Nikto, OWASP ZAP active scan, etc.) against a live site without the site owner's written authorization
- Attempt to log in, brute-force, or test authentication mechanisms in any way

Reason: scanning or probing a computer system without authorization is a
criminal offence under Section 43/66 of India's IT Act, 2000 — it does not
matter that the intent is academic or that the target is a public-facing
government site. All §5.3 items above the "manual-only" line in the
tables are marked that way *because* verifying them properly requires
authorized access this project does not have — not because they're
unimportant. The correct output for these in the tool's manual-review
checklist is: "requires an authorized CERT-In/STQC security audit — not
verifiable by this tool."

## 8. GIGW 3.0 Clause Coverage Table — Section 5.4 (Lifecycle) — 10 clauses

| Clause ID | Title | Automation | Severity | Owner | Notes |
|---|---|---|---|---|---|
| 5.4.1 | Web Information Manager (WIM) nominated, contact details displayed | semi | medium | C | WIM contact-details presence on site automatable; actual formal nomination (JS-rank official) is manual |
| 5.4.2 | Website URL on all organisational stationery/publicity material | manual-only | low | C | concerns physical/external materials, not the website itself |
| 5.4.3 | Copyright, CMAP, CAP, CRP, Hyperlinking, T&C, Monitoring Plan policies defined | semi | medium | C | presence of policy pages automatable; WIM-approval status is manual |
| 5.4.4 | Hyperlink accuracy checked; external links clearly indicated | semi | medium | C | can detect external-link indicators (icon/new-tab attribute); content accuracy is manual |
| 5.4.5 | Content free of offensive/discriminatory language | semi | high | C | toxicity/content-moderation API gives heuristic flags only, not authoritative |
| 5.4.6 | Multi-language versions updated simultaneously | semi | medium | C | comparable only if per-language "last updated" timestamps exist; true sync is manual |
| 5.4.7 | No broken links (internal or external) | automatable | medium | C | standard link-checker crawl |
| 5.4.8 | No "under construction" pages | automatable | low | C | text-pattern detection ("under construction", "coming soon", etc.) |
| 5.4.9 | Documents provided in HTML or accessible formats (not scanned-image-only PDFs) | semi | medium | C | file-type detection automatable; whether a PDF is properly tagged/accessible needs a dedicated PDF accessibility checker (potential Phase 4 enhancement) |
| 5.4.10 | Bilingual, prominent language selector, Unicode characters used | automatable | medium | C | language-switch UI detection + charset/encoding check |

## 9. Out of scope (explicitly, to prevent scope creep)

- Verifying legal/organisational facts not observable on the website itself
  (WIM's formal rank, actual "safe to host" certificate validity, permission
  agreements for reproduced content, whether stationery/ads display the URL).
- Any active security testing beyond passive header/TLS/cookie inspection —
  see §6. This tool produces an *indicative* cybersecurity checklist, not a
  certifying security audit.
- Non-Indian-government sites (domain check assumes `.gov.in`/`.nic.in`
  family; tool is not designed for general web compliance auditing).
- Judging subjective content quality (grammar/toxicity checks are heuristic
  flags for the manual-review queue, never presented as a definitive pass/fail).
