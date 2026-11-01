import { NextResponse, type NextRequest } from "next/server";
import { topics } from "./lib/catalogue";
import { getPartyDirectory } from "./lib/parties/data";

export async function proxy(request: NextRequest) {
  // Validate before the loading boundary streams a 200 response.
  let slug: string;
  try { slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2]); }
  catch { return NextResponse.rewrite(new URL("/404", request.url), { status: 404 }); }
  if (request.nextUrl.pathname.startsWith("/parties/")) {
    if (slug === "preview") return NextResponse.next();
    const directory = await getPartyDirectory();
    if (directory.status === "error") return new NextResponse("Imenik stranaka privremeno nije dostupan.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    if (directory.parties.some((party) => party.slug === slug)) return NextResponse.next();
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  }
  const valid = request.nextUrl.pathname.startsWith("/compare/")
    ? slug === "governments" || slug === "parties"
    : topics.some((topic) => topic.slug === slug);
  if (!valid)
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: ["/topics/:slug", "/compare/:slug", "/parties/:slug"] };
