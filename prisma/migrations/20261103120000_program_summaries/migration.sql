-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProgramExtraction" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "extractor" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "pages" JSONB NOT NULL,
    "complete" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSummary" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "generationKey" TEXT,
    "provider" TEXT NOT NULL,
    "requestedModel" TEXT NOT NULL,
    "modelIdentifier" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedJson" JSONB NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "SummaryStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProgramSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummaryReview" (
    "id" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummaryReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramExtraction_versionId_extractor_contentHash_key" ON "ProgramExtraction"("versionId", "extractor", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSummary_generationKey_key" ON "ProgramSummary"("generationKey");

-- CreateIndex
CREATE INDEX "ProgramSummary_versionId_status_idx" ON "ProgramSummary"("versionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSummary_versionId_sequence_key" ON "ProgramSummary"("versionId", "sequence");

-- AddForeignKey
ALTER TABLE "ProgramExtraction" ADD CONSTRAINT "ProgramExtraction_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProgramDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSummary" ADD CONSTRAINT "ProgramSummary_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProgramDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSummary" ADD CONSTRAINT "ProgramSummary_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "ProgramExtraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummaryReview" ADD CONSTRAINT "SummaryReview_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ProgramSummary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
