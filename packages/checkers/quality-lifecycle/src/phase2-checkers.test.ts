/**
 * Unit tests for all Phase 2 quality-lifecycle checkers (B-012).
 * Uses mock CheckerContext — no Playwright or network needed.
 * Owner: Member B.
 */

import { describe, it, expect } from "vitest";
import type { CheckerContext } from "./types.js";
import type { Page } from "playwright";

import { ownershipInfoChecker } from "./ownership-info.js";
import { lastUpdatedChecker } from "./last-updated.js";
import { contactPageChecker } from "./contact-page.js";
import { nationalPortalLinkChecker } from "./national-portal-link.js";
import { responsiveDesignChecker } from "./responsive-design.js";
import { socialMediaLinksChecker } from "./social-media-links.js";
import { aboutPageChecker } from "./about-page.js";
import { feedbackMechanismChecker } from "./feedback-mechanism.js";
import { underConstructionChecker } from "./under-construction.js";
import { bilingualChecker } from "./bilingual.js";
import { wimContactChecker } from "./wim-contact.js";
import { policyPagesChecker } from "./policy-pages.js";

const mockPage = {} as Page;
const GOV_URL = "https://example.gov.in/";

function makeCtx(html: string, pageUrl = GOV_URL): CheckerContext {
  return { page: mockPage, pageUrl, html };
}

// ── ownershipInfoChecker — 5.1.2 ─────────────────────────────────────────────

describe("ownershipInfoChecker — 5.1.2", () => {
  it("passes when 'Government of India' is present", async () => {
    const r = await ownershipInfoChecker.run(makeCtx("<p>Government of India</p>"));
    expect(r[0]?.status).toBe("pass");
  });

  it("passes for Hindi 'भारत सरकार'", async () => {
    const r = await ownershipInfoChecker.run(makeCtx("<p>भारत सरकार</p>"));
    expect(r[0]?.status).toBe("pass");
  });

  it("passes for 'Ministry of ...'", async () => {
    const r = await ownershipInfoChecker.run(makeCtx("<p>Ministry of Home Affairs</p>"));
    expect(r[0]?.status).toBe("pass");
  });

  it("needs_review for weak signal (govt.in only)", async () => {
    const r = await ownershipInfoChecker.run(makeCtx("<a href='https://govt.in'>link</a>"));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no ownership signal at all", async () => {
    const r = await ownershipInfoChecker.run(makeCtx("<html><body><p>Welcome</p></body></html>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("returns exactly one result", async () => {
    const r = await ownershipInfoChecker.run(makeCtx(""));
    expect(r).toHaveLength(1);
  });

  it("result has clauseId 5.1.2 and severity medium", async () => {
    const r = await ownershipInfoChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.2");
    expect(r[0]?.severity).toBe("medium");
  });
});

// ── lastUpdatedChecker — 5.1.5 ───────────────────────────────────────────────

describe("lastUpdatedChecker — 5.1.5", () => {
  it("passes for 'Last Updated: 12 Jan 2024'", async () => {
    const r = await lastUpdatedChecker.run(makeCtx("<p>Last Updated: 12 Jan 2024</p>"));
    expect(r[0]?.status).toBe("pass");
    expect(r[0]?.detail).toMatchObject({ foundDate: "12 Jan 2024" });
  });

  it("passes for 'Updated on January 5, 2025'", async () => {
    const r = await lastUpdatedChecker.run(makeCtx("<span>Updated on January 5, 2025</span>"));
    expect(r[0]?.status).toBe("pass");
  });

  it("passes for <time datetime> attribute", async () => {
    const r = await lastUpdatedChecker.run(makeCtx('<time datetime="2024-03-15">March 2024</time>'));
    expect(r[0]?.status).toBe("pass");
    expect(r[0]?.detail).toMatchObject({ foundDate: "2024-03-15" });
  });

  it("fails when no date pattern found", async () => {
    const r = await lastUpdatedChecker.run(makeCtx("<html><body><p>Hello World</p></body></html>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.1.5 and severity low", async () => {
    const r = await lastUpdatedChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.5");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── contactPageChecker — 5.1.10 ──────────────────────────────────────────────

describe("contactPageChecker — 5.1.10", () => {
  it("passes when contact link text is present", async () => {
    const r = await contactPageChecker.run(makeCtx('<a href="/contact">Contact Us</a>'));
    expect(r[0]?.status).toBe("pass");
    expect(r[0]?.detail).toMatchObject({ href: "/contact" });
  });

  it("passes for case-insensitive 'CONTACT US'", async () => {
    const r = await contactPageChecker.run(makeCtx('<a href="/contact-us">CONTACT US</a>'));
    expect(r[0]?.status).toBe("pass");
  });

  it("fails when no contact link is present", async () => {
    const r = await contactPageChecker.run(makeCtx("<nav><a href='/home'>Home</a></nav>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.1.10 and severity medium", async () => {
    const r = await contactPageChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.10");
    expect(r[0]?.severity).toBe("medium");
  });
});

// ── nationalPortalLinkChecker — 5.1.12 ───────────────────────────────────────

describe("nationalPortalLinkChecker — 5.1.12", () => {
  it("passes when india.gov.in link has target=_blank", async () => {
    const r = await nationalPortalLinkChecker.run(
      makeCtx('<a href="https://india.gov.in" target="_blank">National Portal</a>'),
    );
    expect(r[0]?.status).toBe("pass");
  });

  it("needs_review when india.gov.in link exists but no target=_blank", async () => {
    const r = await nationalPortalLinkChecker.run(
      makeCtx('<a href="https://india.gov.in">National Portal</a>'),
    );
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no india.gov.in link at all", async () => {
    const r = await nationalPortalLinkChecker.run(makeCtx("<p>No portal link here</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.1.12 and severity low", async () => {
    const r = await nationalPortalLinkChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.12");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── responsiveDesignChecker — 5.1.15 ─────────────────────────────────────────

describe("responsiveDesignChecker — 5.1.15", () => {
  const FULL_HTML = `
    <html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="style.css">
      <style>@media (max-width: 768px) { body { font-size: 14px; } }</style>
    </head><body></body></html>
  `;

  it("passes when viewport, stylesheet, and media query all present", async () => {
    const r = await responsiveDesignChecker.run(makeCtx(FULL_HTML));
    expect(r[0]?.status).toBe("pass");
  });

  it("fails when viewport meta is missing", async () => {
    const html = '<html><head><link rel="stylesheet" href="s.css"></head></html>';
    const r = await responsiveDesignChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("fail");
    expect(r[0]?.evidence).toContain("viewport");
  });

  it("needs_review when viewport present but stylesheet missing", async () => {
    const html = `
      <html><head>
        <meta name="viewport" content="width=device-width">
        <style>@media screen { }</style>
      </head></html>
    `;
    const r = await responsiveDesignChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("result has clauseId 5.1.15 and severity medium", async () => {
    const r = await responsiveDesignChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.15");
    expect(r[0]?.severity).toBe("medium");
  });
});

// ── socialMediaLinksChecker — 5.1.24 ─────────────────────────────────────────

describe("socialMediaLinksChecker — 5.1.24", () => {
  it("passes when 2+ social platforms are linked", async () => {
    const html = `
      <a href="https://twitter.com/example">Twitter</a>
      <a href="https://facebook.com/example">Facebook</a>
    `;
    const r = await socialMediaLinksChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("pass");
    expect((r[0]?.detail as { foundPlatforms: string[] }).foundPlatforms).toHaveLength(2);
  });

  it("needs_review when only 1 platform linked", async () => {
    const html = '<a href="https://youtube.com/channel/abc">YouTube</a>';
    const r = await socialMediaLinksChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no social links found", async () => {
    const r = await socialMediaLinksChecker.run(makeCtx("<p>No social media</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("detects Koo and YouTube", async () => {
    const html = `
      <a href="https://kooapp.com/profile/example">Koo</a>
      <a href="https://youtube.com/c/example">YouTube</a>
    `;
    const r = await socialMediaLinksChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("pass");
  });

  it("result has clauseId 5.1.24 and severity low", async () => {
    const r = await socialMediaLinksChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.24");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── aboutPageChecker — 5.1.9 ─────────────────────────────────────────────────

describe("aboutPageChecker — 5.1.9", () => {
  it("needs_review when 'About Us' link found (presence automatable, currency manual)", async () => {
    const r = await aboutPageChecker.run(makeCtx('<a href="/about-us">About Us</a>'));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("needs_review for href containing 'about'", async () => {
    const r = await aboutPageChecker.run(makeCtx('<a href="/about">The Ministry</a>'));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no about link present", async () => {
    const r = await aboutPageChecker.run(makeCtx("<nav><a href='/home'>Home</a></nav>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.1.9 and severity low", async () => {
    const r = await aboutPageChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.9");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── feedbackMechanismChecker — 5.1.11 ────────────────────────────────────────

describe("feedbackMechanismChecker — 5.1.11", () => {
  it("needs_review when feedback link present", async () => {
    const r = await feedbackMechanismChecker.run(makeCtx('<a href="/feedback">Feedback</a>'));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("needs_review when grievance link present", async () => {
    const r = await feedbackMechanismChecker.run(makeCtx('<a href="/grievance">Grievance</a>'));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("needs_review when a form is present (no explicit feedback link)", async () => {
    const r = await feedbackMechanismChecker.run(
      makeCtx('<form action="/submit"><input type="text"></form>'),
    );
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no feedback link or form found", async () => {
    const r = await feedbackMechanismChecker.run(makeCtx("<p>Hello World</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.1.11 and severity low", async () => {
    const r = await feedbackMechanismChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.1.11");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── underConstructionChecker — 5.4.8 ─────────────────────────────────────────

describe("underConstructionChecker — 5.4.8", () => {
  it("fails for 'under construction'", async () => {
    const r = await underConstructionChecker.run(makeCtx("<h1>This page is under construction</h1>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("fails for 'coming soon'", async () => {
    const r = await underConstructionChecker.run(makeCtx("<p>Coming Soon!</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("fails for 'work in progress'", async () => {
    const r = await underConstructionChecker.run(makeCtx("<p>Work in Progress</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("fails for Hindi निर्माणाधीन", async () => {
    const r = await underConstructionChecker.run(makeCtx("<p>यह पृष्ठ निर्माणाधीन है</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("passes for normal content", async () => {
    const r = await underConstructionChecker.run(makeCtx("<h1>Welcome to the Ministry</h1>"));
    expect(r[0]?.status).toBe("pass");
  });

  it("result has clauseId 5.4.8 and severity low", async () => {
    const r = await underConstructionChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.4.8");
    expect(r[0]?.severity).toBe("low");
  });
});

// ── bilingualChecker — 5.4.10 ────────────────────────────────────────────────

describe("bilingualChecker — 5.4.10", () => {
  const FULL_BILINGUAL = `
    <html lang="en">
      <head><meta charset="UTF-8"></head>
      <body>
        <a href="/hi">हिन्दी</a>
        <a href="/en">English</a>
      </body>
    </html>
  `;

  it("returns 3 results (language-selector, lang-attribute, utf8-charset)", async () => {
    const r = await bilingualChecker.run(makeCtx(FULL_BILINGUAL));
    expect(r).toHaveLength(3);
  });

  it("all 3 pass for a fully bilingual page", async () => {
    const r = await bilingualChecker.run(makeCtx(FULL_BILINGUAL));
    expect(r.every((x) => x.status === "pass")).toBe(true);
  });

  it("language-selector fails when no Hindi/English toggle found", async () => {
    const html = '<html lang="en"><head><meta charset="UTF-8"></head><body></body></html>';
    const r = await bilingualChecker.run(makeCtx(html));
    const selector = r.find((x) => (x.detail as { subCheck: string }).subCheck === "language-selector");
    expect(selector?.status).toBe("fail");
  });

  it("lang-attribute fails when <html> has no lang", async () => {
    const html = '<html><head><meta charset="UTF-8"></head><body><a href="/hi">हिन्दी</a></body></html>';
    const r = await bilingualChecker.run(makeCtx(html));
    const lang = r.find((x) => (x.detail as { subCheck: string }).subCheck === "lang-attribute");
    expect(lang?.status).toBe("fail");
  });

  it("utf8 fails when charset missing", async () => {
    const html = '<html lang="en"><head></head><body><a href="/hi">हिन्दी</a></body></html>';
    const r = await bilingualChecker.run(makeCtx(html));
    const utf8 = r.find((x) => (x.detail as { subCheck: string }).subCheck === "utf8-charset");
    expect(utf8?.status).toBe("fail");
  });

  it("all results have clauseId 5.4.10 and severity medium", async () => {
    const r = await bilingualChecker.run(makeCtx(FULL_BILINGUAL));
    expect(r.every((x) => x.clauseId === "5.4.10")).toBe(true);
    expect(r.every((x) => x.severity === "medium")).toBe(true);
  });
});

// ── wimContactChecker — 5.4.1 ────────────────────────────────────────────────

describe("wimContactChecker — 5.4.1", () => {
  it("needs_review when WIM label and phone/email present", async () => {
    const html = "<p>Web Information Manager: wim@example.gov.in, 0123-456789</p>";
    const r = await wimContactChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("needs_review when WIM label present but no contact details", async () => {
    const html = "<p>Web Information Manager</p>";
    const r = await wimContactChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("needs_review when contact details present but no WIM label", async () => {
    const html = "<p>Contact: 9876543210</p>";
    const r = await wimContactChecker.run(makeCtx(html));
    expect(r[0]?.status).toBe("needs_review");
  });

  it("fails when no WIM label and no contact details", async () => {
    const r = await wimContactChecker.run(makeCtx("<p>Hello World</p>"));
    expect(r[0]?.status).toBe("fail");
  });

  it("result has clauseId 5.4.1 and severity medium", async () => {
    const r = await wimContactChecker.run(makeCtx(""));
    expect(r[0]?.clauseId).toBe("5.4.1");
    expect(r[0]?.severity).toBe("medium");
  });
});

// ── policyPagesChecker — 5.4.3 ───────────────────────────────────────────────

describe("policyPagesChecker — 5.4.3", () => {
  it("returns 4 results (one per policy)", async () => {
    const r = await policyPagesChecker.run(makeCtx("<p>hello</p>"));
    expect(r).toHaveLength(4);
  });

  it("needs_review when policy text found (human verifies completeness)", async () => {
    const html = `
      <a href="/copyright-policy">Copyright Policy</a>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms-and-conditions">Terms and Conditions</a>
      <a href="/hyperlinking-policy">Hyperlinking Policy</a>
    `;
    const r = await policyPagesChecker.run(makeCtx(html));
    expect(r.every((x) => x.status === "needs_review")).toBe(true);
  });

  it("fails for policies not found", async () => {
    const r = await policyPagesChecker.run(makeCtx("<p>No policies here</p>"));
    expect(r.every((x) => x.status === "fail")).toBe(true);
  });

  it("handles mixed — some found, some not", async () => {
    const html = '<a href="/privacy">Privacy Policy</a>';
    const r = await policyPagesChecker.run(makeCtx(html));
    const byName = Object.fromEntries(
      r.map((x) => [(x.detail as { subCheck: string }).subCheck, x.status]),
    );
    expect(byName["Privacy Policy"]).toBe("needs_review");
    expect(byName["Copyright Policy"]).toBe("fail");
    expect(byName["Hyperlinking Policy"]).toBe("fail");
  });

  it("all results have clauseId 5.4.3 and severity medium", async () => {
    const r = await policyPagesChecker.run(makeCtx(""));
    expect(r.every((x) => x.clauseId === "5.4.3")).toBe(true);
    expect(r.every((x) => x.severity === "medium")).toBe(true);
  });
});
