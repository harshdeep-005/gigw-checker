import { prisma } from "../packages/db/src/index.js";

const jobId = process.argv[2];
if (!jobId) { console.error("Usage: npx tsx scripts/check-report.ts <jobId>"); process.exit(1); }

const report = await prisma.siteReport.findFirst({
  where: { jobId },
  include: { pages: { include: { results: { take: 3 } } } },
});

if (!report) {
  console.log("No SiteReport found for job", jobId);
  const job = await prisma.crawlJob.findUnique({ where: { id: jobId }, select: { status: true } });
  console.log("Job status:", job?.status);
} else {
  console.log(`\nReport ID : ${report.id}`);
  console.log(`Site URL  : ${report.siteUrl}`);
  console.log(`Score     : ${String(report.overallScore)}%`);
  console.log(`Quality   : ${String(report.scoreQuality)}`);
  console.log(`Access.   : ${String(report.scoreAccessibility)}`);
  console.log(`Cyber.    : ${String(report.scoreCybersecurity)}`);
  console.log(`Lifecycle : ${String(report.scoreLifecycle)}`);
  console.log(`Pages     : ${String(report.pages.length)}`);
  for (const p of report.pages) {
    console.log(`  ${p.pageUrl} — score ${String(p.score)}%, pass ${String(p.passCount)}, fail ${String(p.failCount)}, results ${String(p.results.length)}`);
  }
  console.log(`\nDashboard: http://localhost:5173/reports/${report.id}`);
}

await prisma.$disconnect();
