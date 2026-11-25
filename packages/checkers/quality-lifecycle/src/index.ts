/**
 * @gigw/checker-quality-lifecycle
 *
 * All Section 5.1 (Quality) + Section 5.4 (Lifecycle) checkers.
 * Owner: Member B. See requirements.md §4 and §8 for clause tables.
 */

export type { CheckerModule, CheckerContext, CheckerFn } from "./types.js";

// ── Phase 1 PoC (B-004) ──────────────────────────────────────────────────────
import { officialDomainChecker } from "./official-domain.js";
import { metadataChecker } from "./metadata.js";

// ── §5.1 Automatable (B-005) ─────────────────────────────────────────────────
import { ownershipInfoChecker } from "./ownership-info.js";
import { lastUpdatedChecker } from "./last-updated.js";
import { contactPageChecker } from "./contact-page.js";
import { nationalPortalLinkChecker } from "./national-portal-link.js";
import { responsiveDesignChecker } from "./responsive-design.js";
import { socialMediaLinksChecker } from "./social-media-links.js";

// ── §5.1 Semi-automatable (B-006) ────────────────────────────────────────────
import { aboutPageChecker } from "./about-page.js";
import { feedbackMechanismChecker } from "./feedback-mechanism.js";

// ── §5.4 Automatable (B-007) ─────────────────────────────────────────────────
import { brokenLinksChecker } from "./broken-links.js";
import { underConstructionChecker } from "./under-construction.js";
import { bilingualChecker } from "./bilingual.js";

// ── §5.4 Semi-automatable (B-008) ────────────────────────────────────────────
import { wimContactChecker } from "./wim-contact.js";
import { policyPagesChecker } from "./policy-pages.js";

export const qualityLifecycleCheckers: import("./types.js").CheckerModule[] = [
  // §5.1 — Quality
  officialDomainChecker, // 5.1.1 — official .gov.in / .nic.in domain
  ownershipInfoChecker, // 5.1.2 — ministry / GoI ownership info present
  lastUpdatedChecker, // 5.1.5 — last updated / reviewed date
  aboutPageChecker, // 5.1.9 — about us section present
  contactPageChecker, // 5.1.10 — contact us page linked
  feedbackMechanismChecker, // 5.1.11 — feedback / grievance form present
  nationalPortalLinkChecker, // 5.1.12 — india.gov.in link with target="_blank"
  responsiveDesignChecker, // 5.1.15 — viewport meta + stylesheet + media queries
  metadataChecker, // 5.1.21 — page title, meta description, meta keywords
  socialMediaLinksChecker, // 5.1.24 — social media links present

  // §5.4 — Lifecycle
  wimContactChecker, // 5.4.1 — WIM contact details
  policyPagesChecker, // 5.4.3 — copyright / privacy / T&C / hyperlinking policy pages
  brokenLinksChecker, // 5.4.7 — no broken links
  underConstructionChecker, // 5.4.8 — no under construction pages
  bilingualChecker, // 5.4.10 — language selector + lang attr + UTF-8
];
