-- CreateEnum
CREATE TYPE "ClauseCategory" AS ENUM ('quality', 'accessibility', 'cybersecurity', 'lifecycle');

-- CreateEnum
CREATE TYPE "ClauseAutomation" AS ENUM ('automatable', 'semi_automatable', 'manual_only');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('pass', 'fail', 'needs_review', 'not_applicable');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('pending', 'crawled', 'error', 'skipped');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'crawling', 'checking', 'aggregating', 'done', 'failed');

-- CreateTable
CREATE TABLE "clause_definitions" (
    "clauseId" TEXT NOT NULL,
    "section" "ClauseCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "automation" "ClauseAutomation" NOT NULL,
    "ownerMember" CHAR(1) NOT NULL,
    "checkerId" TEXT,

    CONSTRAINT "clause_definitions_pkey" PRIMARY KEY ("clauseId")
);

-- CreateTable
CREATE TABLE "checker_results" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "severity" "Severity" NOT NULL,
    "evidence" TEXT NOT NULL,
    "detail" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "pageReportId" TEXT,

    CONSTRAINT "checker_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "discoveredFrom" TEXT,
    "status" "RouteStatus" NOT NULL DEFAULT 'pending',
    "httpStatus" INTEGER,
    "crawledAt" TIMESTAMP(3),
    "jobId" TEXT NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_reports" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passCount" INTEGER NOT NULL,
    "failCount" INTEGER NOT NULL,
    "needsReview" INTEGER NOT NULL,
    "notApplicable" INTEGER NOT NULL,
    "siteReportId" TEXT NOT NULL,

    CONSTRAINT "page_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_reports" (
    "id" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "crawlStartedAt" TIMESTAMP(3) NOT NULL,
    "crawlFinishedAt" TIMESTAMP(3),
    "totalRoutesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "totalRoutesChecked" INTEGER NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION,
    "scoreQuality" DOUBLE PRECISION,
    "scoreAccessibility" DOUBLE PRECISION,
    "scoreCybersecurity" DOUBLE PRECISION,
    "scoreLifecycle" DOUBLE PRECISION,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "site_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" TEXT NOT NULL,
    "seedUrl" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routes_jobId_url_key" ON "routes"("jobId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "site_reports_jobId_key" ON "site_reports"("jobId");

-- AddForeignKey
ALTER TABLE "checker_results" ADD CONSTRAINT "checker_results_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "clause_definitions"("clauseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checker_results" ADD CONSTRAINT "checker_results_pageReportId_fkey" FOREIGN KEY ("pageReportId") REFERENCES "page_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "crawl_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_reports" ADD CONSTRAINT "page_reports_siteReportId_fkey" FOREIGN KEY ("siteReportId") REFERENCES "site_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "crawl_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
