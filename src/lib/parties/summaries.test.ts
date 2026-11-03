import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { authenticateEditor, validEditorialOrigin } from "../editorial-auth";
import { parseExtractedPages } from "./extraction";
import { boundedResponse, llmConfiguration, pageBatches, requestSummary, summaryPrompt } from "./llm";
import { fixtureQuote, fixtureSummary } from "./summary-fixture";
import { validateSummary } from "./summary-contract";

afterEach(() => vi.unstubAllEnvs());
describe("Croatian summary grounding and extraction", () => {
  const pages = [{ page: 1, text: fixtureQuote }];
  it("accepts exact page evidence and rejects missing, repeated or ungrounded topics and invented numbers", () => {
    expect(validateSummary(fixtureSummary(), pages, true).language).toBe("hr-HR");
    for (const mutate of [
      (input: ReturnType<typeof fixtureSummary>) => { input.sections[0] = input.sections[1]; },
      (input: ReturnType<typeof fixtureSummary>) => { input.sections.find((item) => item.topic === "housing")!.proposals[0].evidence[0].page = 2; },
      (input: ReturnType<typeof fixtureSummary>) => { input.sections.find((item) => item.topic === "housing")!.proposals[0].evidence[0].quote = "An invented quotation that is absent."; },
      (input: ReturnType<typeof fixtureSummary>) => { input.sections.find((item) => item.topic === "housing")!.proposals[0].text = "Program predlaže izgradnju 500 stanova."; },
      (input: ReturnType<typeof fixtureSummary>) => { input.sections[0].coverage = "addressed"; },
    ]) { const input = fixtureSummary(); mutate(input); expect(() => validateSummary(input, pages, true)).toThrow(); }
    expect(() => validateSummary({ ...fixtureSummary(), language: "en" }, pages, true)).toThrow();
  });
  it("never treats incomplete extraction as an absent topic", () => {
    const summary = fixtureSummary(); summary.sections[0].coverage = "not-addressed";
    expect(() => validateSummary(summary, pages, false)).toThrow(/Nepotpuna/);
    expect(validateSummary(summary, pages, true)).toEqual(summary);
    expect(() => parseExtractedPages(`${fixtureQuote}\f`, 2)).toThrow(/count/);
    expect(() => parseExtractedPages("\f", 1)).toThrow(/OCR/);
    expect(parseExtractedPages(`${fixtureQuote.repeat(2)}\f\f`, 2).complete).toBe(false);
    const chunks = pageBatches([{ page: 1, text: "a".repeat(30000) }, { page: 2, text: "b".repeat(30000) }]);
    expect(chunks.map((batch) => batch[0].page)).toEqual([1, 2]);
    expect(() => pageBatches([{ page: 1, text: "a".repeat(48001) }])).toThrow();
  });
  it("requests strict structured output, has no tools, and rejects refusals, truncation, unsafe endpoints and oversized responses", async () => {
    const config = { endpoint: "https://provider.example/v1/chat/completions", model: "fixture-model", key: "fixture-secret" };
    const request = vi.fn(async () => Response.json({ model: "fixture-model", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(fixtureSummary()) } }] }));
    expect((await requestSummary(config, { pages }, request)).content).toEqual(fixtureSummary());
    const body = JSON.parse((request.mock.calls as unknown as [string, RequestInit][])[0][1].body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.tools).toBeUndefined(); expect(body.store).toBe(false);
    expect(summaryPrompt).toContain("hr-HR"); expect(summaryPrompt).toContain("NEPOUZDANI PODACI");
    for (const choice of [{ finish_reason: "length", message: { content: "{}" } }, { finish_reason: "stop", message: { content: null, refusal: "refused" } }]) await expect(requestSummary(config, {}, async () => Response.json({ model: "fixture", choices: [choice] }))).rejects.toThrow();
    await expect(requestSummary(config, {}, async () => new Response("not JSON", { status: 503 }))).rejects.toThrow(/503/);
    await expect(boundedResponse(new Response("123456"), 5)).rejects.toThrow(/size/);
    vi.stubEnv("LLM_BASE_URL", "http://remote.example/v1");
    expect(() => llmConfiguration()).toThrow(/HTTPS/);
  });
});

describe("editorial authentication and CSRF boundary", () => {
  const token = "a".repeat(43);
  const configuration = JSON.stringify([{ id: "ana", role: "reviewer", tokenHash: createHash("sha256").update(token).digest("hex") }]);
  const basic = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  it("fails closed and derives the actor and role only from server configuration", () => {
    expect(authenticateEditor(basic("ana", token), configuration)).toEqual({ id: "ana", role: "reviewer" });
    for (const header of [null, "Bearer anything", basic("other", token), basic("ana", "b".repeat(43)), basic("ana", "short")]) expect(authenticateEditor(header, configuration)).toBeNull();
    expect(authenticateEditor(basic("ana", token), "[]")).toBeNull();
    expect(authenticateEditor(basic("ana", token), "malformed")).toBeNull();
  });
  it("requires an explicit exact trusted origin for mutations", () => {
    const request = (origin?: string) => new Request("https://example.org/admin", { headers: origin ? { origin } : {} });
    expect(validEditorialOrigin(request("https://example.org"), "https://example.org")).toBe(true);
    expect(validEditorialOrigin(request("https://evil.example"), "https://example.org")).toBe(false);
    expect(validEditorialOrigin(request(), "https://example.org")).toBe(false);
    expect(validEditorialOrigin(request("http://example.org"), "http://example.org")).toBe(false);
    expect(validEditorialOrigin(request("http://127.0.0.1:3100"), "http://127.0.0.1:3100")).toBe(true);
  });
});
