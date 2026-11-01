import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return new Response("Dokument nije pronađen.", { status: 404 });
  try {
    const version = await getDb().programDocumentVersion.findFirst({ where: { id, publishedAt: { not: null } } });
    if (!version) return new Response("Dokument nije pronađen.", { status: 404 });
    if (!/^[a-f0-9]{64}$/.test(version.contentHash)) throw new Error("Invalid archived content hash.");
    // Archives live on durable runtime storage, not in the frontend deployment bundle.
    const directory = resolve(/* turbopackIgnore: true */ process.env.PROGRAM_DOCUMENT_DIR ?? ".data/programs");
    const bytes = await readFile(resolve(directory, `${version.contentHash}.pdf`));
    if (createHash("sha256").update(bytes).digest("hex") !== version.contentHash) throw new Error("Document integrity check failed.");
    return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="program-v${version.version}.pdf"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch {
    return new Response("Sačuvani dokument privremeno nije dostupan. Poveznica na izvornik ostaje na profilu stranke.", { status: 503 });
  }
}
