ALTER TABLE "SourceRevision" ADD COLUMN "sourceUpdatedAt" TIMESTAMPTZ(3);
ALTER TABLE "IndicatorObservation" ADD COLUMN "sourceFlags" TEXT NOT NULL DEFAULT '';
