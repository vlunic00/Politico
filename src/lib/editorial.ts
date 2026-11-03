import "server-only";
import { headers } from "next/headers";
import { authenticateEditor } from "./editorial-auth";

export async function requireEditor() {
  const actor = authenticateEditor((await headers()).get("authorization"));
  if (!actor) throw new Error("Potrebna je urednička prijava.");
  return actor;
}
