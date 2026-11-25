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
import { tableMarkupChecker } from "./table-markup.js";
import { minContentChecker } from "./min-content.js";

// ── §5.1 Semi-automatable (B-006) ────────────────────────────────────────────
import { aboutPageChecker } from "./about-page.js";
import { feedbackMechanismChecker } from "./feedback-mechanism.js";
import { helpLinkChecker } from "./help-link.js";
import { noCssReadableChecker } from "./no-css-readable.js";
import { downloadMetadataChecker } from "./download-metadata.js";
import { circularMetaChecker } from "./circular-meta.js";
import { staleContentChecker } from "./stale-content.js";
import { printLayoutChecker } from "./print-layout.js";
import { indiaPortalIntegrationChecker } from "./india-portal-integration.js";
import { spellingChecker } from "./spelling.js";

// ── §5.4 Automatable (B-007) ─────────────────────────────────────────────────
import { brokenLinksChecker } from "./broken-links.js";
import { underConstructionChecker } from "./under-construction.js";
import { bilingualChecker } from "./bilingual.js";

// ── §5.4 Semi-automatable (B-008) ────────────────────────────────────────────
import { wimContactChecker } from "./wim-contact.js";
import { policyPagesChecker } from "./policy-pages.js";
import { hyperlinkAccuracyChecker } from "./hyperlink-accuracy.js";
import { contentModerationChecker } from "./content-moderation.js";
import { multilangSyncChecker } from "./multilang-sync.js";
import { accessibleDocsChecker } from "./accessible-docs.js";

export const qualityLifecycleCheckers: import("./types.js").CheckerModule[] = [
  // §5.1 — Quality (21 automatable/semi clauses; 4 manual-only excluded)
  officialDomainChecker,            // 5.1.1
  ownershipInfoChecker,             // 5.1.2
  downloadMetadataChecker,          // 5.1.6
  circularMetaChecker,              // 5.1.7
  staleContentChecker,              // 5.1.8
  aboutPageChecker,                 // 5.1.9
  contactPageChecker,               // 5.1.10
  feedbackMechanismChecker,         // 5.1.11
  nationalPortalLinkChecker,        // 5.1.12
  helpLinkChecker,                  // 5.1.14
  responsiveDesignChecker,          // 5.1.15
  noCssReadableChecker,             // 5.1.16
  metadataChecker,                  // 5.1.17
  minContentChecker,                // 5.1.18
  tableMarkupChecker,               // 5.1.19
  printLayoutChecker,               // 5.1.20
  lastUpdatedChecker,               // 5.1.5 (also covers 5.1.21 date aspect)
  indiaPortalIntegrationChecker,    // 5.1.22
  socialMediaLinksChecker,          // 5.1.24
  spellingChecker,                  // 5.1.25

  // §5.4 — Lifecycle (8 automatable/semi clauses; 2 manual-only excluded)
  wimContactChecker,                // 5.4.1
  policyPagesChecker,               // 5.4.3
  hyperlinkAccuracyChecker,         // 5.4.4
  contentModerationChecker,         // 5.4.5
  multilangSyncChecker,             // 5.4.6
  brokenLinksChecker,               // 5.4.7
  underConstructionChecker,         // 5.4.8
  accessibleDocsChecker,            // 5.4.9
  bilingualChecker,                 // 5.4.10
];
