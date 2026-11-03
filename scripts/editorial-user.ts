import { createHash, randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { z } from "zod";

const { values } = parseArgs({ options: { id: { type: "string" }, role: { type: "string" } } });
const id = z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/).parse(values.id);
const role = z.enum(["editor", "reviewer"]).parse(values.role);
const token = randomBytes(32).toString("base64url");
console.info(`User: ${id}\nPassword (store securely; shown once): ${token}\nAdd this entry to the server-only EDITORIAL_USERS JSON array:\n${JSON.stringify({ id, role, tokenHash: createHash("sha256").update(token).digest("hex") })}`);
