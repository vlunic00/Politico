import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, join, sep } from "node:path";
import { backupFiles, hashFile, verifyBackup } from "../src/lib/operations/backup";

const [destination, mode] = process.argv.slice(2);
if (!destination || !["--writers-paused", "--verify"].includes(mode)) throw new Error("Usage: npm run ops:backup -- <new-directory> --writers-paused | --verify");
const directory = resolve(destination);
if (mode === "--verify") {
  const result = await verifyBackup(directory);
  console.info(`Verified ${result.files.length} backup files.`);
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const roots = [resolve(process.env.DATA_SNAPSHOT_DIR ?? ".data/snapshots"), resolve(process.env.PROGRAM_DOCUMENT_DIR ?? ".data/programs")];
  if (roots.some((root) => directory === root || directory.startsWith(`${root}${sep}`))) throw new Error("Backup destination must be outside the evidence directories.");
  // Refuse symlinks before copying evidence, and never overwrite a previous backup.
  for (const root of roots) await backupFiles(root);
  await mkdir(directory, { mode: 0o700 });
  const database = new URL(process.env.DATABASE_URL);
  database.searchParams.delete("schema");
  const password = decodeURIComponent(database.password);
  database.password = "";
  try {
    await promisify(execFile)(process.env.PGDUMP_PATH || "pg_dump", ["--dbname", database.toString(), "--format=custom", "--no-owner", "--no-acl", "--file", join(directory, "database.dump")], {
      env: { ...process.env, PGPASSWORD: password, PGCONNECT_TIMEOUT: "10" }, windowsHide: true, timeout: 1_800_000,
    });
  } catch { throw new Error("pg_dump failed; incomplete backup retained without a manifest. Check connectivity and client/server versions."); }
  await cp(roots[0], join(directory, "snapshots"), { recursive: true, errorOnExist: true, force: false });
  await cp(roots[1], join(directory, "programs"), { recursive: true, errorOnExist: true, force: false });
  const files = await Promise.all((await backupFiles(directory)).map(async (path) => ({ path: relative(directory, path).split(sep).join("/"), sha256: await hashFile(path) })));
  await writeFile(join(directory, "manifest.json"), JSON.stringify({ version: 1, createdAt: new Date().toISOString(), files }, null, 2), { flag: "wx", mode: 0o600 });
  await verifyBackup(directory);
  console.info(`Backup complete: ${files.length} files. Encrypt and copy off-host; perform a restore drill before trusting it.`);
}
