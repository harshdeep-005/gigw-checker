/**
 * Unit tests for all 16 semi-automatable §5.2 accessibility checkers.
 *
 * Uses a mock CheckerContext with a lightweight Page stub that intercepts
 * $$eval / evaluate / keyboard calls and returns synthetic data.
 * No real browser is started — tests run in Node.js via vitest.
 *
 * Owner: Member A (A-010).
 */

import { describe, it, expect, vi } from "vitest";
import type { Page } from "playwright";
import type { CheckerContext } from "./types.js";

import { textAlternativesChecker } from "./text-alternatives.js";
import { captionsChecker } from "./captions.js";
import { keyboardChecker } from "./keyboard.js";
import { reflowChecker } from "./reflow.js";
import { linkPurposeChecker } from "./link-purpose.js";
import { headingsChecker } from "./headings.js";
import { colourChecker } from "./colour.js";
import { imagesOfTextChecker } from "./images-of-text.js";
import { textSpacingChecker } from "./text-spacing.js";
import { motionChecker } from "./motion.js";
import { flashingChecker } from "./flashing.js";
import { focusOrderChecker } from "./focus-order.js";
import { languagePartsChecker } from "./language-parts.js";
import { navigationChecker } from "./navigation.js";
import { errorIdChecker } from "./error-id.js";
import { statusMessagesChecker } from "./status-messages.js";

// ── Page mock factory ─────────────────────────────────────────────────────────

type EvalFn = (...args: unknown[]) => unknown;

function makePageMock(overrides: Partial<Record<string, EvalFn>> = {}): Page {
  return {
    $$eval: vi.fn((_selector: string, fn: EvalFn, ...args: unknown[]) => {
      if (overrides["$$eval"]) return Promise.resolve(overrides["$$eval"](_selector, fn, ...args));
      return Promise.resolve(fn([], ...args));
    }),
    evaluate: vi.fn((fn: EvalFn, ...args: unknown[]) => {
      if (overrides["evaluate"]) return Promise.resolve(overrides["evaluate"](fn, ...args));
      return Promise.resolve((fn as (...a: unknown[]) => unknown)(...args));
    }),
    addStyleTag: vi.fn(() => Promise.resolve()),
    waitForTimeout: vi.fn(() => Promise.resolve()),
    viewportSize: vi.fn(() => ({ width: 1280, height: 720 })),
    setViewportSize: vi.fn(() => Promise.resolve()),
    keyboard: {
      press: vi.fn(() => Promise.resolve()),
    },
  } as unknown as Page;
}

function makeCtx(page: Page, html = "", pageUrl = "https://uidai.gov.in/"): CheckerContext {
  return { page, pageUrl, html };
}

// ── text-alternatives ─────────────────────────────────────────────────────────

describe("textAlternativesChecker — 5.2.1", () => {
  it("returns not_applicable when no images", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.1");
  });

  it("fails when an image has no alt attribute", async () => {
    const page = makePageMock({
      $$eval: () => [{ alt: null, src: "photo.jpg" }],
    });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.severity).toBe("high");
  });

  it("returns needs_review for generic alt text", async () => {
    const page = makePageMock({
      $$eval: () => [{ alt: "image", src: "photo.jpg" }],
    });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });

  it("returns needs_review for filename-like alt text", async () => {
    const page = makePageMock({
      $$eval: () => [{ alt: "logo.png", src: "assets/logo.png" }],
    });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });

  it("passes when all images have meaningful alt text", async () => {
    const page = makePageMock({
      $$eval: () => [
        { alt: "Prime Minister addressing the nation", src: "pm.jpg" },
        { alt: "UIDAI headquarters building", src: "hq.jpg" },
      ],
    });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
  });

  it("result has correct shape", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await textAlternativesChecker.run(makeCtx(page));
    expect(r?.clauseId).toBe("5.2.1");
    expect(typeof r?.evidence).toBe("string");
    expect(r?.checkedAt).toBeInstanceOf(Date);
  });
});

// ── captions ─────────────────────────────────────────────────────────────────

describe("captionsChecker — 5.2.3", () => {
  it("returns not_applicable when no videos", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await captionsChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.3");
  });

  it("fails when video has no caption track", async () => {
    const page = makePageMock({
      $$eval: () => [{ hasCaption: false, src: "video.mp4", trackCount: 0 }],
    });
    const [r] = await captionsChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.severity).toBe("high");
  });

  it("returns needs_review when video has caption track", async () => {
    const page = makePageMock({
      $$eval: () => [{ hasCaption: true, src: "video.mp4", trackCount: 1 }],
    });
    const [r] = await captionsChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });
});

// ── reflow ────────────────────────────────────────────────────────────────────

describe("reflowChecker — 5.2.15 + 5.2.17", () => {
  it("returns results for both clauses", async () => {
    const page = makePageMock({
      evaluate: () => ({
        scrollWidth: 320,
        clientWidth: 320,
        hasHorizontalScroll: false,
        htmlFs: "16px",
        bodyFs: "16px",
        blocksScaling: false,
        viewportContent: "width=device-width, initial-scale=1",
      }),
    });
    const results = await reflowChecker.run(makeCtx(page));
    expect(results).toHaveLength(2);
    const clauseIds = results.map((r) => r.clauseId);
    expect(clauseIds).toContain("5.2.17");
    expect(clauseIds).toContain("5.2.15");
  });

  it("5.2.17 fails when horizontal scroll is detected", async () => {
    const page = makePageMock({
      evaluate: () => ({
        scrollWidth: 500,
        clientWidth: 320,
        hasHorizontalScroll: true,
        htmlFs: "16px",
        bodyFs: "16px",
        blocksScaling: false,
        viewportContent: "",
      }),
    });
    const results = await reflowChecker.run(makeCtx(page));
    const r17 = results.find((r) => r.clauseId === "5.2.17");
    expect(r17?.status).toBe("fail");
  });

  it("5.2.15 fails when viewport blocks scaling", async () => {
    const page = makePageMock({
      evaluate: () => ({
        scrollWidth: 320,
        clientWidth: 320,
        hasHorizontalScroll: false,
        htmlFs: "16px",
        bodyFs: "16px",
        blocksScaling: true,
        viewportContent: "width=device-width, user-scalable=no",
      }),
    });
    const results = await reflowChecker.run(makeCtx(page));
    const r15 = results.find((r) => r.clauseId === "5.2.15");
    expect(r15?.status).toBe("fail");
    expect(r15?.evidence).toContain("user-scalable=no");
  });
});

// ── link-purpose ──────────────────────────────────────────────────────────────

describe("linkPurposeChecker — 5.2.30", () => {
  it("returns not_applicable when no links", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await linkPurposeChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.30");
  });

  it("fails when links have generic text", async () => {
    const page = makePageMock({
      $$eval: () => [
        { accessibleName: "click here", href: "https://example.gov.in" },
        { accessibleName: "read more", href: "https://example.gov.in/article" },
      ],
    });
    const [r] = await linkPurposeChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("click here");
  });

  it("passes when all links have descriptive text", async () => {
    const page = makePageMock({
      $$eval: () => [
        { accessibleName: "Download Aadhaar card", href: "https://uidai.gov.in" },
        { accessibleName: "Apply for PAN card online", href: "https://incometax.gov.in" },
      ],
    });
    const [r] = await linkPurposeChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
  });
});

// ── headings ──────────────────────────────────────────────────────────────────

describe("headingsChecker — 5.2.32", () => {
  it("returns not_applicable when no headings", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await headingsChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.32");
  });

  it("fails when h1 is missing", async () => {
    const page = makePageMock({
      $$eval: () => [
        { level: 2, text: "About Us" },
        { level: 3, text: "Contact" },
      ],
    });
    const [r] = await headingsChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("h1");
  });

  it("fails when heading levels skip", async () => {
    const page = makePageMock({
      $$eval: () => [
        { level: 1, text: "Home" },
        { level: 3, text: "Services" }, // skips h2
      ],
    });
    const [r] = await headingsChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("h1 → h3");
  });

  it("returns needs_review for multiple h1s", async () => {
    const page = makePageMock({
      $$eval: () => [
        { level: 1, text: "Main heading" },
        { level: 1, text: "Another heading" },
        { level: 2, text: "Sub-section" },
      ],
    });
    const [r] = await headingsChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("2 <h1>");
  });

  it("returns needs_review for valid structure (descriptiveness is manual)", async () => {
    const page = makePageMock({
      $$eval: () => [
        { level: 1, text: "Ministry of Finance" },
        { level: 2, text: "About the Ministry" },
        { level: 2, text: "Latest News" },
        { level: 3, text: "Budget 2026" },
      ],
    });
    const [r] = await headingsChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });
});

// ── colour ────────────────────────────────────────────────────────────────────

describe("colourChecker — 5.2.12", () => {
  it("always returns needs_review (heuristic only)", async () => {
    const page = makePageMock({ evaluate: () => [] });
    const [r] = await colourChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.clauseId).toBe("5.2.12");
  });

  it("includes findings in evidence when issues detected", async () => {
    const page = makePageMock({
      evaluate: () => ["5 of 10 links (50%) have no underline"],
    });
    const [r] = await colourChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("5 of 10 links");
  });
});

// ── images-of-text ────────────────────────────────────────────────────────────

describe("imagesOfTextChecker — 5.2.16", () => {
  it("returns needs_review when no suspect images", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await imagesOfTextChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.clauseId).toBe("5.2.16");
  });

  it("returns needs_review when suspect images found", async () => {
    const page = makePageMock({
      $$eval: () => [
        {
          alt: "Welcome to the official website of Ministry",
          src: "banner.jpg",
          inHeading: false,
          inButton: false,
        },
      ],
    });
    const [r] = await imagesOfTextChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("1 image");
  });
});

// ── text-spacing ──────────────────────────────────────────────────────────────

describe("textSpacingChecker — 5.2.19", () => {
  it("passes when no clipping detected", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await textSpacingChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
    expect(r?.clauseId).toBe("5.2.19");
  });

  it("fails when clipped elements found", async () => {
    const page = makePageMock({
      $$eval: () => [{ tag: "div", text: "Navigation links clipped" }],
    });
    const [r] = await textSpacingChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("1 element");
  });
});

// ── motion ────────────────────────────────────────────────────────────────────

describe("motionChecker — 5.2.25", () => {
  it("fails when marquee is present", async () => {
    const page = makePageMock({
      evaluate: () => ({ marqueeCount: 1, infiniteAnimations: 0, carouselSuspects: 0 }),
    });
    const [r] = await motionChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("<marquee>");
    expect(r?.clauseId).toBe("5.2.25");
  });

  it("returns needs_review when infinite animation present", async () => {
    const page = makePageMock({
      evaluate: () => ({ marqueeCount: 0, infiniteAnimations: 2, carouselSuspects: 0 }),
    });
    const [r] = await motionChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });

  it("passes when no motion found", async () => {
    const page = makePageMock({
      evaluate: () => ({ marqueeCount: 0, infiniteAnimations: 0, carouselSuspects: 0 }),
    });
    const [r] = await motionChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
  });
});

// ── flashing ──────────────────────────────────────────────────────────────────

describe("flashingChecker — 5.2.26", () => {
  it("fails when fast infinite animation detected", async () => {
    const page = makePageMock({
      evaluate: () => ({
        flashingElements: [{ tag: "div", duration: "200ms" }],
        blinkCount: 0,
        gifCount: 0,
      }),
    });
    const [r] = await flashingChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.clauseId).toBe("5.2.26");
  });

  it("returns needs_review for GIFs", async () => {
    const page = makePageMock({
      evaluate: () => ({ flashingElements: [], blinkCount: 0, gifCount: 3 }),
    });
    const [r] = await flashingChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("3 GIF");
  });

  it("passes when nothing found", async () => {
    const page = makePageMock({
      evaluate: () => ({ flashingElements: [], blinkCount: 0, gifCount: 0 }),
    });
    const [r] = await flashingChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
  });
});

// ── focus-order ───────────────────────────────────────────────────────────────

describe("focusOrderChecker — 5.2.29", () => {
  it("returns not_applicable when no focusable elements", async () => {
    const page = makePageMock({ $$eval: () => [] });
    const [r] = await focusOrderChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.29");
  });

  it("returns needs_review when positive tabindex found", async () => {
    const page = makePageMock({
      $$eval: () => [{ tag: "a", tabIndex: 3, domIndex: 0, text: "Skip to content", id: "skip" }],
    });
    const [r] = await focusOrderChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("positive tabindex");
  });

  it("returns needs_review for normal tab order (manual verification needed)", async () => {
    const page = makePageMock({
      $$eval: () => [
        { tag: "a", tabIndex: 0, domIndex: 0, text: "Home", id: "" },
        { tag: "a", tabIndex: 0, domIndex: 1, text: "About", id: "" },
      ],
    });
    const [r] = await focusOrderChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });
});

// ── language-parts ────────────────────────────────────────────────────────────

describe("languagePartsChecker — 5.2.39", () => {
  it("returns needs_review when no page lang attribute", async () => {
    const page = makePageMock({
      evaluate: () => ({
        pageLang: "",
        parts: [],
        hasDevanagari: false,
        bodyLength: 1000,
      }),
    });
    const [r] = await languagePartsChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.clauseId).toBe("5.2.39");
  });

  it("fails for invalid BCP-47 lang values on sub-elements", async () => {
    const page = makePageMock({
      evaluate: () => ({
        pageLang: "en",
        parts: [{ tag: "span", lang: "hindi", text: "हिंदी" }],
        hasDevanagari: true,
        bodyLength: 5000,
      }),
    });
    const [r] = await languagePartsChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("invalid BCP-47");
  });

  it("returns needs_review for Devanagari on English page without marked parts", async () => {
    const page = makePageMock({
      evaluate: () => ({
        pageLang: "en",
        parts: [],
        hasDevanagari: true,
        bodyLength: 5000,
      }),
    });
    const [r] = await languagePartsChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
    expect(r?.evidence).toContain("Devanagari");
  });
});

// ── navigation ────────────────────────────────────────────────────────────────

describe("navigationChecker — 5.2.42 + 5.2.43", () => {
  it("returns 2 results (one per clause)", async () => {
    const page = makePageMock({
      evaluate: () => ({
        navCount: 1,
        hasSkipLink: true,
        hasHeader: true,
        hasMain: true,
        hasFooter: true,
        hasSearch: true,
      }),
    });
    const results = await navigationChecker.run(makeCtx(page));
    expect(results).toHaveLength(2);
    const ids = results.map((r) => r.clauseId);
    expect(ids).toContain("5.2.42");
    expect(ids).toContain("5.2.43");
  });

  it("5.2.42 fails when no nav landmark found", async () => {
    const page = makePageMock({
      evaluate: () => ({
        navCount: 0,
        hasSkipLink: false,
        hasHeader: true,
        hasMain: true,
        hasFooter: true,
        hasSearch: false,
      }),
    });
    const results = await navigationChecker.run(makeCtx(page));
    const r42 = results.find((r) => r.clauseId === "5.2.42");
    expect(r42?.status).toBe("fail");
  });
});

// ── error-id ──────────────────────────────────────────────────────────────────

describe("errorIdChecker — 5.2.44", () => {
  it("returns not_applicable when no inputs", async () => {
    const page = makePageMock({
      evaluate: () => ({ inputCount: 0, invalidInputs: [], formCount: 0 }),
    });
    const [r] = await errorIdChecker.run(makeCtx(page));
    expect(r?.status).toBe("not_applicable");
    expect(r?.clauseId).toBe("5.2.44");
  });

  it("fails when aria-invalid input has no describedby", async () => {
    const page = makePageMock({
      evaluate: () => ({
        inputCount: 2,
        formCount: 1,
        invalidInputs: [
          {
            id: "email",
            type: "email",
            hasAriaDescribedby: false,
            errorElExists: false,
            errorText: "",
          },
        ],
      }),
    });
    const [r] = await errorIdChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.evidence).toContain("no aria-describedby");
  });

  it("returns needs_review when no inputs are invalid (form not submitted)", async () => {
    const page = makePageMock({
      evaluate: () => ({ inputCount: 3, invalidInputs: [], formCount: 1 }),
    });
    const [r] = await errorIdChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });
});

// ── status-messages ───────────────────────────────────────────────────────────

describe("statusMessagesChecker — 5.2.50", () => {
  it("fails when form exists but no live regions", async () => {
    const page = makePageMock({
      evaluate: () => ({
        liveRegions: [],
        hasForm: true,
        hasSearchInput: false,
        hasLoadingIndicators: false,
      }),
    });
    const [r] = await statusMessagesChecker.run(makeCtx(page));
    expect(r?.status).toBe("fail");
    expect(r?.clauseId).toBe("5.2.50");
    expect(r?.evidence).toContain("forms");
  });

  it("returns needs_review when live regions present", async () => {
    const page = makePageMock({
      evaluate: () => ({
        liveRegions: [{ tag: "div", role: "status", ariaLive: "", text: "Form submitted" }],
        hasForm: true,
        hasSearchInput: false,
        hasLoadingIndicators: false,
      }),
    });
    const [r] = await statusMessagesChecker.run(makeCtx(page));
    expect(r?.status).toBe("needs_review");
  });

  it("passes when no dynamic content", async () => {
    const page = makePageMock({
      evaluate: () => ({
        liveRegions: [],
        hasForm: false,
        hasSearchInput: false,
        hasLoadingIndicators: false,
      }),
    });
    const [r] = await statusMessagesChecker.run(makeCtx(page));
    expect(r?.status).toBe("pass");
  });
});

// ── keyboard (extra coverage) ─────────────────────────────────────────────────

describe("keyboardChecker — 5.2.21 + 5.2.22", () => {
  it("returns 2 results (one per clause)", async () => {
    const page = makePageMock({
      $$eval: () => [],
      evaluate: () => null, // no focused element
    });
    const results = await keyboardChecker.run(makeCtx(page));
    expect(results).toHaveLength(2);
    const ids = results.map((r) => r.clauseId);
    expect(ids).toContain("5.2.21");
    expect(ids).toContain("5.2.22");
  });
});
