import "server-only";
import { cache } from "react";
import { getDb } from "../db";
import { parliamentaryParties } from "../politics";
import { fallbackParties, parliamentaryRegistryIds, partyWebsites, programEvidenceSchema, registerDatasetId, type DirectoryParty, type PublicProgram } from "./catalogue";

export const getPartyDirectory = cache(async () => {
  const fallback = { parties: fallbackParties, checkedAt: null, retrievedAt: null, revision: null, importStatus: null };
  if (!process.env.DATABASE_URL) return { ...fallback, status: "unconfigured" as const };
  try {
    const db = getDb();
    const [revision, dataset] = await Promise.all([
      db.sourceRevision.findFirst({ where: { sourceDatasetId: registerDatasetId, registrations: { some: {} } }, orderBy: { retrievedAt: "desc" }, include: { registrations: { include: { party: { include: { programs: { include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: "desc" } } } } } } } } } }),
      db.sourceDataset.findUnique({ where: { id: registerDatasetId }, include: { ingestionRuns: { orderBy: { startedAt: "desc" }, take: 1 } } }),
    ]);
    if (!revision) return { ...fallback, status: "unimported" as const };
    const parties: DirectoryParty[] = revision.registrations.map((registration) => {
      const legacy = parliamentaryParties.find((party) => parliamentaryRegistryIds[party.slug] === registration.partyId);
      const programs: PublicProgram[] = registration.party.programs.flatMap((program) => program.versions.map((version) => ({
        id: version.id, context: program.context, version: version.version, title: version.title, documentUrl: version.documentUrl, language: version.language,
        publicationDate: version.publicationDate?.toISOString().slice(0, 10) ?? null, retrievedAt: version.retrievedAt.toISOString(), contentHash: version.contentHash,
        publishedAt: version.publishedAt!.toISOString(), evidence: programEvidenceSchema.array().parse(version.evidence),
      })));
      return { ...legacy, id: registration.partyId, slug: registration.party.slug, name: legacy?.name ?? registration.name,
        abbreviation: registration.abbreviation ?? legacy?.abbreviation ?? "—", website: partyWebsites[registration.partyId], programs,
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
