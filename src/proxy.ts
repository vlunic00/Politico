import { NextResponse, type NextRequest } from "next/server";
import { topics } from "./lib/catalogue";
import { getPartyDirectory } from "./lib/parties/data";
import { authenticateEditor } from "./lib/editorial-auth";
import { counties } from "./lib/regions/catalogue";
import { elections } from "./lib/elections/catalogue";
import { getElections } from "./lib/elections/data";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!authenticateEditor(request.headers.get("authorization"))) return new NextResponse("Potrebna je urednička prijava.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Urednistvo", charset="UTF-8"', "Cache-Control": "private, no-store" } });
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }
  // Validate before the loading boundary streams a 200 response.
  let slug: string;
  try { slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2]); }
  catch { return NextResponse.rewrite(new URL("/404", request.url), { status: 404 }); }
  if (request.nextUrl.pathname.startsWith("/regions/")) return counties.some((county) => county.slug === slug) ? NextResponse.next() : NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  if (request.nextUrl.pathname.startsWith("/elections/")) {
    if (!elections.some((election) => election.id === slug)) return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
    if ((await getElections()).status === "error") return new NextResponse("Izborna baza privremeno nije dostupna.", { status: 503 });
    return NextResponse.next();
  }
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

export const config = { matcher: ["/topics/:slug", "/compare/:slug", "/parties/:slug", "/regions/:slug", "/elections/:slug", "/admin/:path*"] };
