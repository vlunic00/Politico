import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  // Messages, URLs, headers and bodies may contain credentials or private reports.
  console.error(JSON.stringify({ event: "request_error", time: new Date().toISOString(),
    digest: error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest.slice(0, 100) : undefined,
    method: request.method, route: context.routePath, type: context.routeType }));
};
