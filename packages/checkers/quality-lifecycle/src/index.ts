/**
 * @gigw/checker-quality-lifecycle
 *
 * All Section 5.1 (Quality) + Section 5.4 (Lifecycle) checkers.
 * Owner: Member B. See requirements.md §4 and §8 for clause tables.
 */

export type { CheckerModule, CheckerContext, CheckerFn } from "./types.js";

import { officialDomainChecker } from "./official-domain.js";
import { metadataChecker } from "./metadata.js";

// Phase 1 PoC checkers (B-004)
// Phase 2: §5.1 automatable (B-005), semi-automatable (B-006),
//          §5.4 automatable (B-007), semi-automatable (B-008)
export const qualityLifecycleCheckers: import("./types.js").CheckerModule[] = [
  officialDomainChecker, // 5.1.1 — official .gov.in / .nic.in domain
  metadataChecker, // 5.1.21 — page title, meta description, meta keywords
];
