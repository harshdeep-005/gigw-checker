/**
 * @gigw/api
 *
 * Fastify HTTP API. Entry point for the compliance checker.
 * Accepts a site URL, validates it, enqueues a crawl job,
 * and exposes endpoints for polling job status + fetching SiteReport.
 *
 * Owned by: shared (both members). See design.md §2.
 *
 * TODO (Phase 1):
 *  - POST /jobs        → accept seed URL, validate .gov.in/.nic.in domain,
 *                        enqueue CrawlJob, return jobId
 *  - GET  /jobs/:id    → poll job status (queued | crawling | checking | done | failed)
 *  - GET  /reports/:id → return full SiteReport (schema.md §6)
 *  - GET  /health      → liveness probe for Docker
 */

import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

await start();
