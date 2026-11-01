import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("official register discovers nonparliamentary parties, keeps statuses separate and preserves filters", async ({ page }) => {
  await page.goto("/parties");
  const state = page.getByRole("region", { name: "Stanje registra" });
  await expect(state).toBeVisible();
  test.skip(!(await state.textContent())?.includes("zapisa službenog registra"), "Run parties:import first.");
  await page.getByLabel("Naziv, kratica ili vodstvo").fill("primorsko goranski");
  await page.getByRole("button", { name: "Pretraži stranke" }).click();
  await expect(page).toHaveURL(/q=primorsko/);
  await expect(page.getByRole("region", { name: "Rezultati imenika" }).getByRole("article")).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("Naziv, kratica ili vodstvo")).toHaveValue("primorsko goranski");
  await page.getByRole("link", { name: "Profil stranke", exact: true }).click();
  await expect(page).toHaveURL(/\/parties\/registar-610018$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("PRIMORSKO GORANSKI SAVEZ");
  await expect(page.getByText("Aktivna u registru", { exact: true })).toBeVisible();
  await expect(page.getByText("Kandidatura · sljedeći parlamentarni izbori")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nema verificiranog programa" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Pretražite teme i pokazatelje" }).fill("PGS");
  await page.getByRole("searchbox", { name: "Pretražite teme i pokazatelje" }).press("Enter");
  await expect(page.getByRole("link", { name: /Stranka PRIMORSKO GORANSKI SAVEZ/ })).toBeVisible();
});

test("ceased records remain searchable and registration never implies future election participation", async ({ page }) => {
  await page.goto("/parties?registration=ceased&q=jadranski+sabor");
  const state = page.getByRole("region", { name: "Stanje registra" });
  await expect(state).toBeVisible();
  test.skip(!(await state.textContent())?.includes("zapisa službenog registra"), "Run parties:import first.");
  await page.getByRole("link", { name: "Profil stranke", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("JADRANSKI SABOR");
  await expect(page.getByText("Prestanak prema registru", { exact: true })).toBeVisible();
  await page.goto("/parties?participation=confirmed&election=next-parliamentary");
  await expect(page.getByRole("heading", { name: "Nema rezultata za odabrane filtre" })).toBeVisible();
  await page.goto("/parties?government=confirmed");
  await expect(page.getByRole("region", { name: "Rezultati imenika" }).getByRole("article")).toHaveCount(2);
  await page.goto("/parties?parliament=represented");
  await expect(page.getByRole("region", { name: "Rezultati imenika" }).getByRole("article")).toHaveCount(21);
  await page.goto("/parties?registration=invalid");
  await expect(page.getByRole("alert").filter({ hasText: "Nevaljani filtri" })).toBeVisible();
});

test("party comparison uses equal columns, exact program citations and honest gaps", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/compare/parties?party=sdp&party=mozemo&party=hdz&party=registar-610018&context=parliamentary-2024");
  test.skip(await page.getByRole("alert").filter({ hasText: "Nevaljan odabir" }).count() > 0, "Run parties:import first.");
  const table = page.getByRole("table", { name: "Usporedba stranaka · Parlamentarni izbori 2024." });
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveCount(5);
  const housing = table.getByRole("row", { name: /^Stanovanje/ });
  await expect(housing).toContainText("Definirat ćemo modele stanovanja");
  await expect(housing).toContainText("Umjesto u pojedinačne stambene kredite");
  await expect(housing.getByRole("link", { name: "Izvorni program · PDF str. 48" })).toHaveAttribute("href", /sdp_program_2024\.pdf#page=48$/);
  await expect(housing.getByRole("cell").nth(3)).toContainText("Nema verificiranog navoda");
  const widths = await table.getByRole("columnheader").evaluateAll((headers) => headers.slice(1).map((header) => header.getBoundingClientRect().width));
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(2);
  await page.screenshot({ path: `test-results/party-comparison-${testInfo.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Programski kontekst").selectOption("next-parliamentary");
  await page.getByRole("button", { name: "Usporedi stranke" }).click();
  await expect(page.getByRole("table")).toContainText("Nema verificiranog programa za odabrani kontekst");
  await page.reload();
  await expect(page.getByLabel("Stranka 4")).toHaveValue("registar-610018");
  for (const query of ["party=sdp&party=sdp", "party=unknown", "party=hdz&party=sdp&party=mozemo&party=most&party=hsu"]) {
    await page.goto(`/compare/parties?${query}`);
    await expect(page.getByRole("alert").filter({ hasText: "Nevaljan odabir" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("published original PDF downloads match the archived hash and unknown documents stay private", async ({ page, request }) => {
  await page.goto("/parties/mozemo");
  await expect(page.getByRole("heading", { name: "Službeni programi i verzije", exact: true })).toBeVisible();
  const download = page.getByRole("link", { name: "Preuzmi sačuvanu verziju PDF-a" });
  test.skip(await download.count() === 0, "Import and verify the initial program documents first.");
  const href = await download.first().getAttribute("href");
  const response = await request.get(href!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toContain("attachment");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  const bytes = await response.body();
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  const hash = createHash("sha256").update(bytes).digest("hex");
  await expect(page.getByText(`SHA-256: ${hash}`, { exact: true })).toBeVisible();
  expect((await request.get("/programs/unknown/document")).status()).toBe(404);
  expect((await request.post(href!, { data: "unauthorized mutation" })).status()).toBe(405);
});
