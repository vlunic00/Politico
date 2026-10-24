-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('AWAITING_VERIFICATION', 'ACTIVE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('FINAL', 'PROVISIONAL', 'REVISED');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'NEEDS_REVIEW', 'FAILED');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDataset" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "methodologyUrl" TEXT NOT NULL,
    "license" TEXT,

    CONSTRAINT "SourceDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRevision" (
    "id" TEXT NOT NULL,
    "sourceDatasetId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "snapshotPath" TEXT NOT NULL,
    "retrievedAt" TIMESTAMPTZ(3) NOT NULL,
    "publicationDate" DATE,

    CONSTRAINT "SourceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeographicArea" (
    "id" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "validFrom" DATE,
    "validTo" DATE,

    CONSTRAINT "GeographicArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "geographicCoverage" TEXT[],
    "sourceDatasetId" TEXT,
    "preferredComparator" TEXT,
    "interpretationRule" TEXT,
    "limitations" TEXT,
    "minimumHistoryPeriods" INTEGER,
    "coverageStatus" "CoverageStatus" NOT NULL DEFAULT 'AWAITING_VERIFICATION',

    CONSTRAINT "IndicatorDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorObservation" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "geographyId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "value" DECIMAL(24,8) NOT NULL,
    "unit" TEXT NOT NULL,
    "publicationDate" DATE,
    "retrievedAt" TIMESTAMPTZ(3) NOT NULL,
    "observationStatus" "ObservationStatus" NOT NULL,
    "revisionId" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "IndicatorObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "sourceDatasetId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "recordsStaged" INTEGER NOT NULL DEFAULT 0,
    "recordsPublished" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDataset_sourceId_externalId_key" ON "SourceDataset"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRevision_sourceDatasetId_contentHash_key" ON "SourceRevision"("sourceDatasetId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorDefinition_slug_key" ON "IndicatorDefinition"("slug");

-- CreateIndex
CREATE INDEX "IndicatorObservation_indicatorId_geographyId_periodStart_idx" ON "IndicatorObservation"("indicatorId", "geographyId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorObservation_indicatorId_geographyId_periodStart_pe_key" ON "IndicatorObservation"("indicatorId", "geographyId", "periodStart", "periodEnd", "revisionId");

-- AddForeignKey
ALTER TABLE "SourceDataset" ADD CONSTRAINT "SourceDataset_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRevision" ADD CONSTRAINT "SourceRevision_sourceDatasetId_fkey" FOREIGN KEY ("sourceDatasetId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorDefinition" ADD CONSTRAINT "IndicatorDefinition_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorDefinition" ADD CONSTRAINT "IndicatorDefinition_sourceDatasetId_fkey" FOREIGN KEY ("sourceDatasetId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorObservation" ADD CONSTRAINT "IndicatorObservation_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "IndicatorDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorObservation" ADD CONSTRAINT "IndicatorObservation_geographyId_fkey" FOREIGN KEY ("geographyId") REFERENCES "GeographicArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorObservation" ADD CONSTRAINT "IndicatorObservation_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SourceRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_sourceDatasetId_fkey" FOREIGN KEY ("sourceDatasetId") REFERENCES "SourceDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
