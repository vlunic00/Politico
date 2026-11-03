-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "round" INTEGER NOT NULL,
    "context" TEXT NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionPublication" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ElectionPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionContest" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "ElectionContest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ElectionPublication_revisionId_key" ON "ElectionPublication"("revisionId");

-- CreateIndex
CREATE INDEX "ElectionPublication_electionId_publishedAt_idx" ON "ElectionPublication"("electionId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionContest_publicationId_code_key" ON "ElectionContest"("publicationId", "code");

-- AddForeignKey
ALTER TABLE "ElectionPublication" ADD CONSTRAINT "ElectionPublication_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPublication" ADD CONSTRAINT "ElectionPublication_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SourceRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionContest" ADD CONSTRAINT "ElectionContest_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "ElectionPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
