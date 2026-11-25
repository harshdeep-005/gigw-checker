import { prisma } from "../packages/db/src/index.js";

const jobs = await prisma.crawlJob.findMany({
  select: { id: true, seedUrl: true, status: true, createdAt: true },
  orderBy: { createdAt: "desc" },
  take: 15,
});

console.log("\nAll jobs (newest first):");
for (const j of jobs) {
  const icon =
    j.status === "done" ? "✓" : j.status === "failed" ? "✗" : j.status === "checking" ? "~" : "·";
  console.log(`  ${icon} ${j.status.padEnd(12)} ${j.seedUrl.padEnd(35)} ${j.id}`);
}

const counts = await prisma.crawlJob.groupBy({ by: ["status"], _count: true });
console.log("\nStatus summary:");
for (const c of counts) console.log(`  ${c.status.padEnd(12)} : ${String(c._count)}`);

const totalResults = await prisma.checkerResult.count();
const totalPages = await prisma.pageReport.count();
const totalSites = await prisma.siteReport.count();
console.log(`\nDB totals: ${String(totalResults)} CheckerResults | ${String(totalPages)} PageReports | ${String(totalSites)} SiteReports`);

await prisma.$disconnect();
