export interface PdfGenerationOptions {
  /** Paper format passed to Playwright page.pdf(). Default: "A4" */
  format?: "A4" | "Letter";
  /** Include a table of contents page. Default: true */
  includeToc?: boolean;
  /** Include the manual-review checklist section. Default: true */
  includeManualChecklist?: boolean;
}
