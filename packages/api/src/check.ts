/**
 * Direct check endpoint — runs all checkers against a single URL immediately.
 * No crawl, no queue, no worker needed.
 *
 * POST /check  { url: string }
 *   → { url, title, results: CheckerResultData[], timing: number }
 *
 * This is the Phase 2 demo mode. Phase 3 wires the full crawl pipeline.
 */

import type { FastifyInstance } from "fastify";
import { chromium } from "playwright";
import type { CheckerResultData } from "@gigw/checker-accessibility";
import { accessibilityCheckers } from "@gigw/checker-accessibility";
import { cybersecurityCheckers } from "@gigw/checker-cybersecurity";
import { qualityLifecycleCheckers } from "@gigw/checker-quality-lifecycle";

const ALLOWED_DOMAIN_RE = /(\.|^)(gov\.in|nic\.in|ac\.in|res\.in|edu\.in)(:\d+)?$/i;

export function registerCheckRoute(app: FastifyInstance): void {
  app.post<{ Body: { url?: string } }>("/check", async (request, reply) => {
    const { url } = request.body;

    if (!url || typeof url !== "string") {
      return reply.status(400).send({ error: "url is required" });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reply.status(400).send({ error: "Invalid URL format" });
    }

    if (!ALLOWED_DOMAIN_RE.test(parsed.hostname)) {
      return reply.status(400).send({
        error: `Only .gov.in, .nic.in, .ac.in, .res.in, .edu.in domains are supported. Received: ${url}`,
      });
    }

    const start = Date.now();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });

      const finalUrl = page.url();
      const html = await page.content();
      const title = await page.title();

      const ctx = { page, pageUrl: finalUrl, html };
      const allResults: CheckerResultData[] = [];

      // Run all three checker suites
      for (const checker of [
        ...qualityLifecycleCheckers,
        ...accessibilityCheckers,
        ...cybersecurityCheckers,
      ]) {
        try {
          allResults.push(...(await checker.run(ctx)));
        } catch {
          // Individual checker errors don't abort the run
        }
      }

      const timing = Date.now() - start;

      return await reply.send({ url: finalUrl, title, results: allResults, timing });
    } catch (err) {
      return await reply.status(500).send({
        error: `Failed to check ${url}: ${String(err)}`,
      });
    } finally {
      await context.close();
      await browser.close();
    }
  });
}
