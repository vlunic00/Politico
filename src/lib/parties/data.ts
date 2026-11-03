import "server-only";
import { cache } from "react";
import { getDb } from "../db";
import { parliamentaryParties } from "../politics";
import { fallbackParties, parliamentaryRegistryIds, partyWebsites, partyElectionRecords, programEvidenceSchema, registerDatasetId, type DirectoryParty, type PublicProgram } from "./catalogue";
import { summarySchema } from "./summary-contract";
import { getElections } from "../elections/data";

export const getPartyDirectory = cache(async () => {
  const fallback = { parties: fallbackParties, checkedAt: null, retrievedAt: null, revision: null, importStatus: null };
  if (!process.env.DATABASE_URL) return { ...fallback, status: "unconfigured" as const };
  try {
    const db = getDb();
    const [revision, dataset] = await Promise.all([
      db.sourceRevision.findFirst({ where: { sourceDatasetId: registerDatasetId, registrations: { some: {} } }, orderBy: { retrievedAt: "desc" }, include: { registrations: { include: { party: { include: { programs: { include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: "desc" }, include: { summaries: { where: { status: "APPROVED", publishedAt: { not: null } }, orderBy: { sequence: "desc" }, select: { id: true, sequence: true, generatedAt: true, publishedAt: true, modelIdentifier: true, promptVersion: true, summaryJson: true } } } } } } } } } } } }),
      db.sourceDataset.findUnique({ where: { id: registerDatasetId }, include: { ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 } } }),
    ]);
    if (!revision) return { ...fallback, status: "unimported" as const };
    const electionData = await getElections();
    const electionRecords = electionData.records.flatMap((election) => election.contests.filter((contest) => !contest.countyId && contest.code !== "22").flatMap((contest) => contest.choices.flatMap((choice) => choice.members.filter((member) => member.partyId).map((member) => ({
      partyId: member.partyId!, context: election.context, electionId: election.id, description: `${election.title} · ${contest.name} · ${member.role === "proposer" ? "predlagatelj kandidata" : "kandidacijska lista"}: ${choice.name}`,
      sourceUrl: contest.sourceUrl, publicationDate: election.metadata.publicationDate,
    })))));
    const parties: DirectoryParty[] = revision.registrations.map((registration) => {
      const legacy = parliamentaryParties.find((party) => parliamentaryRegistryIds[party.slug] === registration.partyId);
      const programs: PublicProgram[] = registration.party.programs.flatMap((program) => program.versions.map((version) => ({
        id: version.id, context: program.context, version: version.version, title: version.title, documentUrl: version.documentUrl, language: version.language,
        publicationDate: version.publicationDate?.toISOString().slice(0, 10) ?? null, retrievedAt: version.retrievedAt.toISOString(), contentHash: version.contentHash,
        publishedAt: version.publishedAt!.toISOString(), evidence: programEvidenceSchema.array().parse(version.evidence),
        summaries: version.summaries.map((summary) => ({ id: summary.id, sequence: summary.sequence, generatedAt: summary.generatedAt.toISOString(), publishedAt: summary.publishedAt!.toISOString(), modelIdentifier: summary.modelIdentifier, promptVersion: summary.promptVersion, content: summarySchema.parse(summary.summaryJson) })),
      })));
      return { ...legacy, id: registration.partyId, slug: registration.party.slug, name: legacy?.name ?? registration.name,
        abbreviation: registration.abbreviation ?? legacy?.abbreviation ?? "—", website: partyWebsites[registration.partyId], programs,
        electionRecords: [...electionRecords, ...partyElectionRecords.filter((record) => !electionData.records.some((election) => election.context === record.context))].filter((record) => record.partyId === registration.partyId),
        registration: { name: registration.name, abbreviation: registration.abbreviation, status: registration.status as "AKTIVAN" | "PRESTANAK",
          registerNumber: registration.registerNumber, book: registration.book, registeredAt: registration.registeredAt.toISOString().slice(0, 10),
          statusDate: registration.statusDate?.toISOString().slice(0, 10) ?? null, seat: registration.seat },
      };
    });
    const checked = await db.ingestionRun.findFirst({ where: { sourceDatasetId: registerDatasetId, status: "SUCCEEDED" }, orderBy: { finishedAt: "desc" } });
    return { parties, status: "ready" as const, retrievedAt: revision.retrievedAt.toISOString(), checkedAt: checked?.finishedAt?.toISOString() ?? null,
      revision: revision.contentHash, importStatus: dataset?.ingestionRuns[0]?.status ?? null };
  } catch (error) {
    console.error("Party register unavailable:", error instanceof Error ? error.message : "Unknown database error");
    return { ...fallback, status: "error" as const };
  }
});
