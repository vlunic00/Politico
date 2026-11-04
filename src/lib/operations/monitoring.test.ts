import { expect, it, vi } from "vitest";
import { onRequestError } from "../../instrumentation";

it("logs framework errors without messages, request URLs, credentials or report bodies", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await onRequestError(Object.assign(new Error("private report and password"), { digest: "test-digest" }), {
      path: "/search?q=private", method: "GET", headers: { authorization: "secret" },
    }, { routerKind: "App Router", routePath: "/search", routeType: "render", renderSource: "react-server-components", revalidateReason: undefined });
    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({ event: "request_error", digest: "test-digest", route: "/search" });
    expect(JSON.stringify(entry)).not.toMatch(/private|password|authorization|secret/);
  } finally { log.mockRestore(); }
});
