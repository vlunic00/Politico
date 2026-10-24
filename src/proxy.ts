import { NextResponse, type NextRequest } from "next/server";
import { topics } from "./lib/catalogue";

export function proxy(request: NextRequest) {
  // Validate before the loading boundary streams a 200 response.
  let slug: string;
  try { slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2]); }
  catch { return NextResponse.rewrite(new URL("/404", request.url), { status: 404 }); }
  if (!topics.some((topic) => topic.slug === slug))
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: "/topics/:slug" };
