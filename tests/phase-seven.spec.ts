import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("accountability shows sourced financing, scoped parliamentary activity and evidence rather than scores", async ({ page }, testInfo) => {
  await page.goto("/accountability");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dokumenti, radnje i dokazi");
  const finance = page.getByRole("table", { name: /^Redovito državno financiranje/ });
  await expect(finance.getByRole("row")).toHaveCount(37);
  await expect(finance.getByRole("row", { name: /^Hrvatska demokratska zajednica/ })).toContainText("3.742.476,30");
  await expect(finance.getByRole("row", { name: /^Zbroj prikazanih redaka/ })).toContainText("9.740.919,01");
  await expect(finance.getByRole("row", { name: /^Ukupno prema izvještaju/ })).toContainText("9.740.919,00");
  await expect(page.locator("#parliament")).toContainText("15. srpnja 2026.");
  await expect(page.locator("#commitments")).toContainText("Utvrđena službena radnja");
  await expect(page.locator("#commitments")).toContainText("Točan datum nije naveden");
  await expect(page.locator("#commitments")).toContainText("zajednički program");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: `test-results/accountability-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("link", { name: "Predložite ispravak ovog zapisa" }).click();
  await expect(page.getByLabel("Putanja stranice")).toHaveValue("/accountability#government-2024-wages");
  await expect(page.getByRole("heading", { name: "Javni dnevnik ispravaka" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});

test("new accountability pages are searchable and COFOG spending histories have source definitions", async ({ page }) => {
  await page.goto("/search?q=financiranje");
  await page.getByRole("link", { name: /Odgovornost Političko financiranje/ }).click();
  await expect(page).toHaveURL(/accountability#financing$/);
  for (const [topic, slug] of [["education", "education-spending"], ["security", "defence-spending"]]) {
    await page.goto(`/topics/${topic}#${slug}`);
    await expect(page.locator(`#${slug}`)).toContainText("COFOG");
    await page.locator(`#${slug}`).getByText("Izvor: Eurostat", { exact: true }).click();
    await expect(page.locator(`#${slug}`).getByRole("link", { name: /Izvorna objava/ })).toHaveAttribute("href", /gov_10a_exp/);
  }
});
