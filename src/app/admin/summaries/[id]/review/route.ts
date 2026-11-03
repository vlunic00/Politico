import { NextResponse } from "next/server";
import { authenticateEditor, validEditorialOrigin } from "@/lib/editorial-auth";
import { getDb } from "@/lib/db";
import { reviewProgramSummary } from "@/lib/parties/summary-review";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = authenticateEditor(request.headers.get("authorization"));
  if (!actor) return new Response("Potrebna je urednička prijava.", { status: 401 });
  if (!validEditorialOrigin(request)) return new Response("Nedopušteno podrijetlo zahtjeva.", { status: 403 });
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Nepostojeći zapis.", { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Nepodržan format.", { status: 415 });
  if (Number(request.headers.get("content-length")) > 300000) return new Response("Prevelik zahtjev.", { status: 413 });
  let result = "saved";
  try {
    const { boundedResponse } = await import("@/lib/parties/llm");
    const data = new URLSearchParams((await boundedResponse(new Response(request.body), 300000)).toString("utf8"));
    for (const key of data.keys()) if (data.getAll(key).length !== 1) throw new Error("Repeated fields.");
    await reviewProgramSummary(getDb(), id, { revision: Number(data.get("revision")), action: data.get("action"),
      content: data.get("action") === "reject" ? null : JSON.parse(data.get("content") ?? "null"), note: data.get("note"),
      sourceChecked: data.get("sourceChecked") === "on", croatianChecked: data.get("croatianChecked") === "on", coverageChecked: data.get("coverageChecked") === "on" }, actor);
  } catch { result = "invalid"; }
  return NextResponse.redirect(new URL(`/admin/summaries/${id}?result=${result}`, process.env.EDITORIAL_ORIGIN!), { status: 303, headers: { "Cache-Control": "private, no-store" } });
}
