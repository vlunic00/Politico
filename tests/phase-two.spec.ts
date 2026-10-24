import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("published GDP has sourced history, aligned EU values and a reference period", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politička slika Hrvatske");
  test.skip(!(await page.getByRole("status").textContent())?.includes("pokazatelja s objavljenim"), "Run data:import against PostgreSQL first.");
  await page.getByRole("link", { name: "Detalji: Realni rast BDP-a", exact: true }).click();
  const gdp = page.locator("#real-gdp-growth");
  await expect(gdp).toContainText(/\d{4}-Q[1-4]/);
  await gdp.screenshot({ path: `test-results/metric-${testInfo.project.name}.png` });
  await gdp.getByText("Tablični prikaz podataka", { exact: true }).click();
  expect(await gdp.getByRole("row").count()).toBeGreaterThan(12);
  const latest = gdp.getByRole("row").last();
  await expect(latest.getByRole("cell").nth(0)).not.toHaveText("Nije dostupno");
  await expect(latest.getByRole("cell").nth(1)).not.toHaveText("Nije dostupno");
  await gdp.locator("summary").filter({ hasText: "Izvor:" }).click();
  await expect(gdp.getByRole("link", { name: "Izvorna objava" })).toHaveAttribute("href", /namq_10_gdp.*CLV_PCH_SM.*SCA/);
  await expect(gdp).toContainText("Objavljeno: nije navedeno");
  await expect(gdp).toContainText("SHA-256:");
  await page.screenshot({ path: `test-results/statistics-${testInfo.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("comparison selections survive in the URL and DZS wages cannot acquire an EU comparator", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politička slika Hrvatske");
  test.skip(!(await page.getByRole("status").textContent())?.includes("pokazatelja s objavljenim"), "Run data:import against PostgreSQL first.");
  await page.getByLabel("Pokazatelj", { exact: true }).selectOption("nominal-net-wages");
  await page.getByLabel("Vremenski raspon").selectOption("5");
  await page.getByRole("button", { name: "Prikaži", exact: true }).click();
  await expect(page).toHaveURL(/indicator=nominal-net-wages&range=5/);
  await expect(page.getByLabel("Pokazatelj", { exact: true })).toHaveValue("nominal-net-wages");
  await expect(page.getByText("Nema usporedivih podataka za EU u posljednjem razdoblju.", { exact: true })).toBeVisible();
  await page.getByText("Tablični prikaz podataka", { exact: true }).click();
  const rows = page.getByRole("table").getByRole("row");
  expect(await rows.count()).toBeGreaterThan(12);
  await expect(rows.last().getByRole("cell").nth(1)).toHaveText("Nije dostupno");
  await page.reload();
  await expect(page.getByLabel("Vremenski raspon")).toHaveValue("5");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
