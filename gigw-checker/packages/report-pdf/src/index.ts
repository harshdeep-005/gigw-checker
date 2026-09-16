/**
 * @gigw/report-pdf
 *
 * Renders a SiteReport as a PDF using Playwright's print-to-PDF.
 * Shared scaffolding — both members. See design.md §2.
 *
 * Approach: render a self-contained HTML report string, load it in a
 * headless Playwright page, then call page.pdf() to produce a buffer.
 * This avoids a separate template server and reuses the Playwright
 * instance already present in the checker engine.
 *
 * TODO (Phase 4 — implementationPlan.md):
 *  - renderReportHtml(report: SiteReport): string
 *    → summary section (overall score, score by section)
 *    → per-page result table (pass/fail/needs_review counts)
 *    → manual-review checklist (clearly separated, requirements.md §1.5)
 *    → per-clause drill-down (failures with evidence strings)
 *  - generatePdf(report: SiteReport): Promise<Buffer>
 *    → spins up a Playwright page, loads the HTML, calls page.pdf()
 */

export type { PdfGenerationOptions } from "./types.js";
