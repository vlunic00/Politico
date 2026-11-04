import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for isolated editorial browser tests.");
const schema = process.env.EDITORIAL_TEST_SCHEMA ?? `summary_e2e_${randomUUID().replaceAll("-", "")}`;
process.env.EDITORIAL_TEST_SCHEMA = schema;
const database = new URL(process.env.DATABASE_URL); database.searchParams.set("schema", schema);
const token = "isolated-browser-fixture-token-not-for-real-use-12345";
const users = JSON.stringify(["editor", "reviewer"].map((role) => ({ id: `test-${role}`, role, tokenHash: createHash("sha256").update(token).digest("hex") })));
export default defineConfig({
  testDir: "./tests", testMatch: "editorial.spec.ts", fullyParallel: false, workers: 1,
  globalSetup: "./tests/editorial-setup.ts", reporter: "list", outputDir: ".data/editorial-test-results",
  use: { baseURL: "http://127.0.0.1:3101", httpCredentials: { username: "test-reviewer", password: token, send: "always" }, trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: { command: "npm run start -- --port 3101", url: "http://127.0.0.1:3101/icon.svg", reuseExistingServer: false, timeout: 60000,
    env: { DATABASE_URL: database.toString(), PROGRAM_DOCUMENT_DIR: resolve(".data", schema), EDITORIAL_USERS: users, EDITORIAL_ORIGIN: "http://127.0.0.1:3101", PUBLIC_ORIGIN: "http://127.0.0.1:3101", LLM_API_KEY: "", LLM_MODEL: "" } },
});
