import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("government history separates five administrations and cites coalition changes and programs", async ({ page }) => {
  await page.goto("/government/history");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Povijest administracija");
  await expect(page.getByRole("list", { name: "Vremenska crta administracija" }).getByRole("article")).toHaveCount(5);
  const firstPlenkovic = page.locator("#plenkovic-1");
  await expect(firstPlenkovic).toContainText("HDZ · Most");
  await expect(firstPlenkovic).toContainText("HDZ · HNS");
  await expect(firstPlenkovic.getByRole("link", { name: "Izvorni program Vlade" })).toHaveAttribute("href", /Program_Vlada_RH_2016_2020/);
  await firstPlenkovic.getByRole("link", { name: "Usporedi ovaj mandat" }).click();
  await expect(page.getByLabel("Prva administracija")).toHaveValue("plenkovic-1");
});

test("comparison form preserves selections and rejects malformed dates and duplicate parameters", async ({ page }) => {
  await page.goto("/compare/governments");
  await expect(page.getByLabel("Prva administracija")).toHaveValue("plenkovic-3");
  await expect(page.getByLabel("Druga administracija")).toHaveValue("plenkovic-2");
  await page.getByLabel("Prva administracija").selectOption("oreskovic");
  await page.getByRole("button", { name: "Prikaži usporedbu" }).click();
  await expect(page).toHaveURL(/first=oreskovic/);
  await expect(page.getByRole("alert").filter({ hasText: "Nevaljan odabir" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Prva administracija")).toHaveValue("oreskovic");
  await page.getByLabel("Način usporedbe").selectOption("custom");
  await page.getByLabel("Početak vlastitog razdoblja").fill("2020-01-01");
  await page.getByLabel("Kraj vlastitog razdoblja").fill("2024-02-29");
  await page.getByRole("button", { name: "Prikaži usporedbu" }).click();
  await expect(page).toHaveURL(/mode=custom/);
  await expect(page.getByRole("alert").filter({ hasText: "Nevaljan odabir" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Kraj vlastitog razdoblja")).toHaveValue("2024-02-29");
  for (const query of ["mode=custom&start=2024-02-30&end=2024-03-01", "mode=custom&start=2025-01-01&end=2024-01-01", "first=plenkovic-1&first=plenkovic-2", "indicator=unknown"]) {
    await page.goto(`/compare/governments?${query}`);
    await expect(page.getByRole("alert").filter({ hasText: "Nevaljan odabir" })).toBeVisible();
    await expect(page.getByRole("figure")).toHaveCount(0);
  }
});

test("published government comparisons show actual periods, dated transitions and honest missing baselines", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/compare/governments");
  test.skip(await page.getByRole("heading", { name: /Nema objavljenih podataka|Statistička baza privremeno/ }).count() > 0, "Requires the existing published statistical database.");
  const current = page.getByRole("region", { name: "16. Vlada · Andrej Plenković III.", exact: true });
  const previous = page.getByRole("region", { name: "15. Vlada · Andrej Plenković II.", exact: true });
  await expect(current.getByRole("row", { name: /Prije početka/ })).toContainText("2024-Q1");
  await expect(current.getByRole("row", { name: /obuhvaća početak/ })).toContainText("2024-Q2");
  await expect(previous.getByRole("row", { name: /Zadnje završeno/ })).toContainText("2024-Q1");
  await expect(page.getByRole("list", { name: "Prijelazi administracija" }).getByRole("listitem")).toHaveCount(4);
  await page.getByRole("figure").scrollIntoViewIfNeeded();
  await expect(page.locator(".recharts-reference-line-line")).toHaveCount(4);
  await page.screenshot({ path: `test-results/government-comparison-${testInfo.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Prva administracija").selectOption("milanovic");
  await page.getByRole("button", { name: "Prikaži usporedbu" }).click();
  await expect(page.getByRole("region", { name: "12. Vlada · Zoran Milanović", exact: true })).toContainText("Nedostaje početno opažanje");
  await page.getByLabel("Pokazatelj", { exact: true }).selectOption("nominal-net-wages");
  await page.getByRole("button", { name: "Prikaži usporedbu" }).click();
  await expect(page.getByRole("region", { name: "15. Vlada · Andrej Plenković II.", exact: true })).toContainText("Nije dostupno");
  expect(errors).toEqual([]);
});
