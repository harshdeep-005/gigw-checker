/**
 * UI health check — visits every dashboard route and reports what's broken.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5173";

const ROUTES = [
  { path: "/", name: "Home" },
  { path: "/accessibility", name: "Accessibility" },
  { path: "/cybersecurity", name: "Cybersecurity" },
  { path: "/reports/cmww59aw300faqj8wb7x8gq4l", name: "SiteReport" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

console.log("╔══════════════════════════════════════════════════╗");
console.log("  GIGW Dashboard UI Health Check");
console.log("╚══════════════════════════════════════════════════╝\n");

for (const route of ROUTES) {
  const page = await context.newPage();
  const jsErrors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") jsErrors.push(m.text()); });
  page.on("pageerror", (e) => jsErrors.push(e.message));

  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Safe content reads — won't throw on timeout
    const h1 = await page.$eval("h1", (el) => el.textContent?.trim() ?? "").catch(() => "(no h1)");
    const h2s = await page.$$eval("h2", (els) => els.map(e => e.textContent?.trim() ?? "").slice(0, 3)).catch(() => []);
    const bodyLen = await page.$eval("body", (el) => (el.textContent ?? "").trim().length).catch(() => 0);

    // Page-specific checks
    const checks: { label: string; pass: boolean; detail?: string }[] = [];

    if (route.path === "/") {
      const hasInput = await page.$("input#seed-url").catch(() => null);
      const hasButton = await page.$("button[type='submit']").catch(() => null);
      checks.push({ label: "URL input exists", pass: hasInput !== null });
      checks.push({ label: "Submit button exists", pass: hasButton !== null });
    }

    if (route.path === "/accessibility") {
      const hasScore = await page.$("[aria-label^='Accessibility']").catch(() => null) ??
                       await page.$("[aria-label^='Overall']").catch(() => null);
      const hasTable = await page.$("button[aria-pressed]").catch(() => null);
      checks.push({ label: "Score badge rendered", pass: hasScore !== null });
      checks.push({ label: "Filter buttons rendered", pass: hasTable !== null });
    }

    if (route.path === "/cybersecurity") {
      const hasScore = await page.$("[aria-label^='Cybersecurity']").catch(() => null) ??
                       await page.$("[aria-label^='Overall']").catch(() => null);
      checks.push({ label: "Score badge rendered", pass: hasScore !== null });
    }

    if (route.path.startsWith("/reports/")) {
      const hasScore = await page.$("[aria-label^='Overall']").catch(() => null);
      const rows = await page.$$("[role='button'][aria-expanded]").catch(() => []);
      checks.push({ label: "Overall score badge", pass: hasScore !== null });
      checks.push({ label: `Page rows rendered (${String(rows.length)})`, pass: rows.length > 0 });
    }

    const isBlank = bodyLen < 100;
    const allChecksPass = checks.every(c => c.pass);
    const status = (isBlank || jsErrors.length > 0 || !allChecksPass) ? "BROKEN" : "OK";

    console.log(`[${status}] ${route.name}  ${BASE}${route.path}`);
    console.log(`  h1: ${h1}`);
    if (h2s.length > 0) console.log(`  h2s: ${h2s.join(" | ")}`);
    console.log(`  body: ${String(bodyLen)} chars`);

    for (const c of checks) {
      console.log(`  ${c.pass ? "✓" : "✗"} ${c.label}`);
    }

    if (jsErrors.length > 0) {
      console.log(`  JS ERRORS:`);
      jsErrors.forEach(e => console.log(`    ✗ ${e.slice(0, 200)}`));
    }
  } catch (err) {
    console.log(`[BROKEN] ${route.name} — ${String(err)}`);
  }

  // Screenshot
  await page.screenshot({
    path: `scripts/ui-${route.name.toLowerCase().replace(/\s+/g, "-")}.png`,
    fullPage: true,
  }).catch(() => {/* ignore */});

  await page.close();
  console.log("");
}

await browser.close();
