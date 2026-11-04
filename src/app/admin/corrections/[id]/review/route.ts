import { NextResponse } from "next/server";
import { authenticateEditor, validEditorialOrigin } from "@/lib/editorial-auth";
import { getDb } from "@/lib/db";
import { reviewCorrection } from "@/lib/corrections";
import { boundedResponse } from "@/lib/parties/llm";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = authenticateEditor(request.headers.get("authorization"));
  if (!actor) return new Response("Potrebna je urednička prijava.", { status: 401 });
  if (actor.role !== "reviewer" || !validEditorialOrigin(request)) return new Response("Nedopušten zahtjev.", { status: 403 });
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Nepostojeći zapis.", { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Nepodržan format.", { status: 415 });
  let result = "saved";
  try {
    const form = new URLSearchParams((await boundedResponse(new Response(request.body), 30000)).toString("utf8"));
    if ([...form.keys()].some((key) => form.getAll(key).length !== 1)) throw new Error("Repeated fields.");
    await reviewCorrection(getDb(), id, { action: form.get("action"), note: form.get("note"), publicSummary: form.get("publicSummary") ?? "", sourceUrl: form.get("sourceUrl") ?? "", applied: form.get("applied") === "on" }, actor);
  } catch { result = "invalid"; }
  return NextResponse.redirect(new URL(`/admin/corrections?result=${result}`, process.env.EDITORIAL_ORIGIN!), { status: 303, headers: { "Cache-Control": "private, no-store" } });
}
