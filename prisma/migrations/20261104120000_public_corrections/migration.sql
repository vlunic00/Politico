CREATE TABLE "Correction" (
    "id" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "proposed" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Correction_status_check" CHECK ("status" IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);
CREATE TABLE "CorrectionReview" (
    "id" TEXT NOT NULL,
    "correctionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "publicSummary" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorrectionReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CorrectionReview_action_check" CHECK ("action" IN ('ACCEPTED', 'REJECTED')),
    CONSTRAINT "CorrectionReview_public_check" CHECK (("action" = 'ACCEPTED' AND "publicSummary" IS NOT NULL AND "sourceUrl" IS NOT NULL) OR ("action" = 'REJECTED' AND "publicSummary" IS NULL AND "sourceUrl" IS NULL)),
    CONSTRAINT "CorrectionReview_correctionId_fkey" FOREIGN KEY ("correctionId") REFERENCES "Correction"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Correction_createdAt_idx" ON "Correction"("createdAt");
CREATE INDEX "Correction_fingerprint_createdAt_idx" ON "Correction"("fingerprint", "createdAt");
CREATE INDEX "CorrectionReview_createdAt_idx" ON "CorrectionReview"("createdAt");
