import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const actorSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/), role: z.enum(["editor", "reviewer"]), tokenHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
// shortcut: HTTP Basic serves trusted maintainers over HTTPS; adopt an identity provider before expanding access.
export type EditorialActor = Pick<z.infer<typeof actorSchema>, "id" | "role">;
export function authenticateEditor(authorization: string | null, configuration = process.env.EDITORIAL_USERS): EditorialActor | null {
  if (!configuration || !authorization?.startsWith("Basic ") || authorization.length > 2000) return null;
  try {
    const users = z.array(actorSchema).min(1).max(30).parse(JSON.parse(configuration));
    if (new Set(users.map((user) => user.id)).size !== users.length) return null;
    const credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = credentials.indexOf(":");
    const user = users.find((user) => user.id === credentials.slice(0, separator));
    const token = credentials.slice(separator + 1);
    if (!user || separator < 1 || token.length < 40) return null;
    const digest = createHash("sha256").update(token).digest();
    return timingSafeEqual(digest, Buffer.from(user.tokenHash, "hex")) ? { id: user.id, role: user.role } : null;
  } catch { return null; }
}

export function validEditorialOrigin(request: Request, configuredOrigin = process.env.EDITORIAL_ORIGIN) {
  if (!configuredOrigin) return false;
  try {
    const origin = new URL(configuredOrigin);
    return origin.origin === configuredOrigin && (origin.protocol === "https:" || (origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))) && request.headers.get("origin") === origin.origin;
  } catch { return false; }
}
