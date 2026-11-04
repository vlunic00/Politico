import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import type { PrismaClient } from "../../generated/prisma/client";
import { sha256 } from "./ingestion";
import { validateProgramDocument } from "./programs";
import { extractionPagesSchema } from "./summary-contract";

const exec = promisify(execFile);
export function pdfPageCount(info: string) {
  const count = Number(info.match(/^Pages:\s+(\d+)\s*$/m)?.[1]);
  if (!Number.isInteger(count) || count < 1 || count > 2000) throw new Error("Unsupported PDF page count.");
  return count;
}
export function pdfProcessEnvironment(): NodeJS.ProcessEnv {
  // Parsers need system paths, never database/editorial/model credentials.
  return { NODE_ENV: process.env.NODE_ENV, ...Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "HOME"].flatMap((key) => process.env[key] ? [[key, process.env[key]!]] : [])) };
}
export const extractorVersion = "pdftotext-layout-utf8-v1";
export function parseExtractedPages(text: string, pageCount: number) {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 2000) throw new Error("Unsupported PDF page count.");
  const parts = text.replace(/\r\n/g, "\n").split("\f");
  if (parts.at(-1)?.trim() === "") parts.pop();
  if (parts.length !== pageCount) throw new Error("Extracted page count does not match the PDF. No pages may be silently dropped.");
  const pages = extractionPagesSchema.parse(parts.map((text, index) => ({ page: index + 1, text: text.trim() })));
  if (pages.reduce((sum, page) => sum + page.text.length, 0) < 100) throw new Error("No usable text. OCR and manual extraction are required for this document.");
  // shortcut: text extraction cannot prove visual completeness; the reviewer must check the original PDF before approval.
  const complete = pages.every((page) => page.text.length >= 40 && !page.text.includes("\uFFFD"));
  return { pages, complete };
}

export async function extractProgram(db: PrismaClient, versionId: string) {
  const version = await db.programDocumentVersion.findUniqueOrThrow({ where: { id: versionId } });
  if (!version.publishedAt) throw new Error("Verify and publish the source document before generating a summary.");
  const bytes = await readFile(version.storedDocumentPath);
  validateProgramDocument(bytes);
  if (sha256(bytes) !== version.contentHash) throw new Error("Archived PDF failed its SHA-256 check.");
  const options = { timeout: 30000, maxBuffer: 12_000_000, windowsHide: true, env: pdfProcessEnvironment() };
  const info = await exec(process.env.PDFINFO_PATH || "pdfinfo", [version.storedDocumentPath], options);
  const count = pdfPageCount(info.stdout);
  const output = await exec(process.env.PDFTOTEXT_PATH || "pdftotext", ["-layout", "-enc", "UTF-8", version.storedDocumentPath, "-"], options);
  const { pages, complete } = parseExtractedPages(output.stdout, count);
  const contentHash = sha256(JSON.stringify(pages));
  return db.programExtraction.upsert({ where: { versionId_extractor_contentHash: { versionId, extractor: extractorVersion, contentHash } },
    create: { versionId, extractor: extractorVersion, contentHash, pages, complete }, update: {} });
}
