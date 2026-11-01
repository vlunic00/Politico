-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyRegistration" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "status" TEXT NOT NULL,
    "registerNumber" TEXT NOT NULL,
    "book" INTEGER NOT NULL,
    "registeredAt" DATE NOT NULL,
    "statusDate" DATE,
    "seat" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PartyRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyProgram" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "context" TEXT NOT NULL,

    CONSTRAINT "PartyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDocumentVersion" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "publicationDate" DATE,
    "retrievedAt" TIMESTAMPTZ(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "revisionHash" TEXT NOT NULL,
    "storedDocumentPath" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "reviewedBy" TEXT,

    CONSTRAINT "ProgramDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramReview" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_slug_key" ON "Party"("slug");

-- CreateIndex
CREATE INDEX "PartyRegistration_revisionId_idx" ON "PartyRegistration"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyRegistration_partyId_revisionId_key" ON "PartyRegistration"("partyId", "revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyProgram_partyId_context_key" ON "PartyProgram"("partyId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDocumentVersion_programId_version_key" ON "ProgramDocumentVersion"("programId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDocumentVersion_programId_revisionHash_key" ON "ProgramDocumentVersion"("programId", "revisionHash");

-- AddForeignKey
ALTER TABLE "PartyRegistration" ADD CONSTRAINT "PartyRegistration_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyRegistration" ADD CONSTRAINT "PartyRegistration_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SourceRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyProgram" ADD CONSTRAINT "PartyProgram_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDocumentVersion" ADD CONSTRAINT "ProgramDocumentVersion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramReview" ADD CONSTRAINT "ProgramReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProgramDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

