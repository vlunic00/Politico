import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, lstat } from "node:fs/promises";
import { join, resolve, relative, sep } from "node:path";
import { z } from "zod";

export async function hashFile(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export async function backupFiles(directory: string): Promise<string[]> {
  if (!(await lstat(directory)).isDirectory()) throw new Error("Backup root must be a regular directory.");
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await backupFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error("Backup may contain only regular files and directories.");
  }
  return files.sort();
}

const manifestSchema = z.object({
  version: z.literal(1), createdAt: z.iso.datetime(),
  files: z.array(z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) })).min(1),
});
export async function verifyBackup(directory: string) {
  const root = resolve(directory);
  const actual = (await backupFiles(root)).filter((path) => path !== join(root, "manifest.json"));
  const manifest = manifestSchema.parse(JSON.parse(await readFile(join(root, "manifest.json"), "utf8")));
  const expected = new Set<string>();
  for (const file of manifest.files) {
    const path = resolve(root, file.path);
    if (!path.startsWith(`${root}${sep}`) || relative(root, path) === "manifest.json" || expected.has(path)) throw new Error("Unsafe or duplicate backup path.");
    expected.add(path);
    if (!(await lstat(path)).isFile() || await hashFile(path) !== file.sha256) throw new Error(`Backup integrity failed: ${file.path}`);
  }
  if (actual.length !== expected.size || actual.some((path) => !expected.has(path)) || !expected.has(join(root, "database.dump"))) throw new Error("Backup file inventory does not match manifest.");
  return manifest;
}
