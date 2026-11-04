import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { accountability } from "../src/lib/accountability/data";
import { boundedResponse } from "../src/lib/parties/llm";

const sha256 = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
const directory = resolve(process.env.DATA_SNAPSHOT_DIR || ".data/snapshots", "accountability");
const manifestPath = `src/lib/accountability/records/${accountability.verifiedAt}.sources.json`;
const allowedHosts = new Set(accountability.sources.map((source) => new URL(source.url).hostname));
allowedHosts.add("sabor.hr"); allowedHosts.add("www.vlada.gov.hr");
type ArchivedSource = { sourceId: string; url: string; sha256: string; retrievedAt: string; file: string };
let previous: ArchivedSource[] = [];
try { previous = JSON.parse(await readFile(manifestPath, "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
await mkdir(directory, { recursive: true });
const manifest: ArchivedSource[] = [];
for (const source of accountability.sources) {
  const pinned = previous.find((entry) => entry.sourceId === source.id);
  if (previous.length) {
    if (!pinned || pinned.url !== source.url || !/^[a-f0-9]{64}\.(pdf|html)$/.test(pinned.file) || pinned.file.split(".")[0] !== pinned.sha256) throw new Error("Manifest no longer matches the dossier; create a new dated version.");
    if (sha256(await readFile(resolve(directory, pinned.file))) !== pinned.sha256) throw new Error("Archived source integrity check failed. Restore the original snapshot from backup.");
    manifest.push(pinned); console.info(`${source.id}: pinned archive verified (no live refresh)`); continue;
  }
  let url = source.url;
  let response: Response | undefined;
  for (let hop = 0; hop < 4; hop++) {
    const target = new URL(url);
    if (target.protocol !== "https:" || target.username || target.password || !allowedHosts.has(target.hostname)) throw new Error("Unsafe source redirect.");
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30000) });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      url = new URL(response.headers.get("location")!, url).href;
      await response.body?.cancel(); response = undefined; continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`${source.id}: source unavailable (${response?.status ?? "redirect limit"}); dossier was not changed.`);
  const contentType = response.headers.get("content-type") || "";
  if (!/application\/pdf|text\/html/.test(contentType)) { await response.body?.cancel(); throw new Error("Unexpected source format."); }
  const bytes = await boundedResponse(response, 10_000_000);
  if (bytes.length < 100 || (contentType.includes("pdf") && bytes.subarray(0, 5).toString() !== "%PDF-")) throw new Error("Empty or malformed source.");
  const hash = sha256(bytes), file = `${hash}.${contentType.includes("pdf") ? "pdf" : "html"}`;
  const snapshotPath = resolve(directory, file);
  try { await writeFile(snapshotPath, bytes, { flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (sha256(await readFile(snapshotPath)) !== hash) throw new Error("Archived source integrity check failed.");
  }
  manifest.push({ sourceId: source.id, url: source.url, sha256: hash, retrievedAt: new Date().toISOString(), file });
  console.info(`${source.id}: ${hash} (${bytes.length} bytes)`);
}
if (!previous.length) await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
console.info(`Pinned ${manifest.length} sources. Back up ${directory} with PostgreSQL.`);
