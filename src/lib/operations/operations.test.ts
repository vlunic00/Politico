import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hashFile, verifyBackup } from "./backup";
import { pdfPageCount, pdfProcessEnvironment } from "../parties/extraction";
import { fetchSnapshot } from "../statistics/adapters";
import { seriesDefinitions } from "../statistics/definitions";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("verifies a backup inventory and rejects tampering, missing, extra and escaping files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "politico-backup-test-"));
  try {
    await mkdir(join(directory, "snapshots"));
    await writeFile(join(directory, "database.dump"), "fixture dump");
    await writeFile(join(directory, "snapshots", "source.json"), "fixture source");
    const files = await Promise.all(["database.dump", "snapshots/source.json"].map(async (path) => ({ path, sha256: await hashFile(join(directory, path)) })));
    const manifest = { version: 1, createdAt: "2026-11-04T00:00:00Z", files };
    const save = (value: unknown) => writeFile(join(directory, "manifest.json"), JSON.stringify(value));
    await save(manifest);
    expect((await verifyBackup(directory)).files).toHaveLength(2);
    await writeFile(join(directory, "extra"), "unexpected");
    await expect(verifyBackup(directory)).rejects.toThrow(/inventory/);
    await rm(join(directory, "extra"));
    await save({ ...manifest, files: [...files, { path: "../outside", sha256: files[0].sha256 }] });
    await expect(verifyBackup(directory)).rejects.toThrow(/Unsafe/);
    await save({ ...manifest, files: [...files, files[0]] });
    await expect(verifyBackup(directory)).rejects.toThrow(/duplicate/);
    await save(manifest);
    await writeFile(join(directory, "database.dump"), "corrupt");
    await expect(verifyBackup(directory)).rejects.toThrow(/integrity/);
    await rm(join(directory, "database.dump"));
    await expect(verifyBackup(directory)).rejects.toThrow();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

it("rejects unsupported PDF counts before invoking text extraction", () => {
  expect(pdfPageCount("Pages:           12\nEncrypted: no")).toBe(12);
  for (const info of ["", "Pages: 0", "Pages: 2001", "Pages: unknown", "Pages: 1oops"]) expect(() => pdfPageCount(info)).toThrow();
  for (const key of ["DATABASE_URL", "LLM_API_KEY", "EDITORIAL_USERS", "NODE_OPTIONS"]) vi.stubEnv(key, "private");
  const environment = pdfProcessEnvironment();
  for (const key of ["DATABASE_URL", "LLM_API_KEY", "EDITORIAL_USERS", "NODE_OPTIONS"]) expect(environment[key]).toBeUndefined();
  expect(environment.PATH).toBe(process.env.PATH);
});

it("uses bounded, timed, non-redirecting source downloads and rejects upstream errors", async () => {
  const def = seriesDefinitions.find((def) => def.slug === "population")!;
  const request = vi.fn(async () => Response.json({ fixture: true }));
  vi.stubGlobal("fetch", request);
  expect((await fetchSnapshot(def)).payload).toEqual({ fixture: true });
  expect(request).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: "error", signal: expect.any(AbortSignal) }));
  vi.stubGlobal("fetch", async () => new Response("offline", { status: 503 }));
  await expect(fetchSnapshot(def)).rejects.toThrow(/503/);
  vi.stubGlobal("fetch", async () => new Response(new Uint8Array(20_000_001)));
  await expect(fetchSnapshot(def)).rejects.toThrow(/size limit/);
});
