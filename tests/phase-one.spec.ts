import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard is honest about unavailable data and links to a definition", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hrvatska u brojkama" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Razvojna verzija");
  await expect(
    page.getByLabel("Vrijednost nije dostupna", { exact: true }),
  ).toHaveCount(8);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Detalji: Realni rast BDP-a", exact: true })
    .click();
  await expect(page).toHaveURL(/\/topics\/economy#real-gdp-growth$/);
  await expect(
    page.getByRole("heading", { name: "Realni rast BDP-a", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nema usporedivih podataka" }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("search accepts Croatian text without diacritics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("place");
  await page.getByRole("searchbox").press("Enter");
  await expect(
    page.getByRole("heading", { name: "Realne plaće", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Pokazatelj Realne plaće/ }).click();
  await expect(page).toHaveURL(/#real-wages$/);
});

test("synthetic chart is labelled, interactive and exposes missing values", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/preview");
  await expect(
    page.getByText("Ovo nisu statistike Hrvatske ili EU-a.", { exact: false }),
  ).toBeVisible();
  await page.getByText("Tablični prikaz podataka", { exact: true }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(7);
  await expect(page.getByRole("cell", { name: "Nije dostupno" })).toBeVisible();
  await page.getByRole("button", { name: "Zadnje 3 točke" }).click();
  await expect(
    page.getByRole("button", { name: "Zadnje 3 točke" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("Phase 1 pages render without horizontal overflow or accessibility violations", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/topics",
    "/government",
    "/government/history",
    "/parties",
    "/parties/preview",
    "/sources",
    "/methodology",
    "/elections",
    "/regions",
    "/compare/parties",
    "/compare/governments",
    "/preview",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      path,
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations,
      `${path}: ${JSON.stringify(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })))}`,
    ).toEqual([]);
  }
});

test("unknown records return a real 404", async ({ page }) => {
  for (const path of [
    "/topics/unknown",
    "/parties/unknown",
    "/compare/unknown",
    "/admin",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Stranica nije pronađena" }),
    ).toBeVisible();
  }
});
