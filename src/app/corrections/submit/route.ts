import { NextResponse } from "next/server";
import { validEditorialOrigin } from "@/lib/editorial-auth";
import { getDb } from "@/lib/db";
import { CorrectionLimitError, correctionSchema, submitCorrection } from "@/lib/corrections";
import { boundedResponse } from "@/lib/parties/llm";

export async function POST(request: Request) {
  const origin = process.env.PUBLIC_ORIGIN ?? process.env.EDITORIAL_ORIGIN;
  if (!validEditorialOrigin(request, origin)) return new Response("Nedopušteno podrijetlo zahtjeva.", { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Nepodržan format.", { status: 415 });
  let form: URLSearchParams;
  try { form = new URLSearchParams((await boundedResponse(new Response(request.body), 24000)).toString("utf8")); }
  catch { return new Response("Prevelik ili prazan zahtjev.", { status: 413 }); }
  if ([...form.keys()].some((key) => form.getAll(key).length !== 1)) return new Response("Ponovljena polja.", { status: 400 });
  if (form.get("website")) return new Response("Nevaljana prijava.", { status: 400 });
  const data = correctionSchema.safeParse(Object.fromEntries([...form].filter(([key]) => key !== "website")));
  if (!data.success) return NextResponse.redirect(new URL("/corrections?result=invalid", origin), 303);
  try { await submitCorrection(getDb(), data.data); }
  catch (error) {
    if (error instanceof CorrectionLimitError) return new Response(error.message, { status: 429, headers: { "Retry-After": "3600" } });
    return new Response("Prijava nije spremljena. Pokušajte kasnije.", { status: 503 });
  }
  return NextResponse.redirect(new URL("/corrections?result=saved", origin), { status: 303, headers: { "Cache-Control": "no-store" } });
}
