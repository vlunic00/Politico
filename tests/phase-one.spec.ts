import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard shows published statistics or honest empty states and links to a definition", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Politička slika Hrvatske" }),
  ).toBeVisible();
  const published = (await page.getByRole("status").textContent())?.includes("pokazatelja s objavljenim opažanjima");
  await expect(page.getByRole("status")).toContainText(published ? "uspješna provjera" : "Nacionalni podaci još nisu povezani");
  const government = page.getByRole("heading", {
    name: "Aktualna Vlada",
    exact: true,
  });
  const parties = page.getByRole("heading", {
    name: "Ostale parlamentarne stranke",
  });
  const indicators = page.getByRole("heading", {
    name: "Nacionalni pokazatelji",
  });
  const positions = await Promise.all(
    [government, parties, indicators].map((heading) =>
      heading.evaluate((node) => node.getBoundingClientRect().top),
    ),
  );
  expect(positions[0]).toBeLessThan(positions[1]);
  expect(positions[1]).toBeLessThan(positions[2]);
  await expect(
    page
      .getByRole("list", { name: "Kartice parlamentarnih stranaka" })
      .getByRole("article"),
  ).toHaveCount(20);
  await expect(
    page.getByText("nije stanje uživo", { exact: false }).first(),
  ).toBeVisible();
  const portrait = page.getByRole("img", {
    name: "Andrej Plenković",
    exact: true,
  });
  await expect(portrait).toBeVisible();
  await expect
    .poll(() =>
      portrait.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  if (!published) await expect(page.getByLabel("Vrijednost nije dostupna", { exact: true })).toHaveCount(8);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `test-results/hero-${testInfo.project.name}.png`,
  });
  await page
    .getByRole("link", { name: "Detalji: Realni rast BDP-a", exact: true })
    .click();
  await expect(page).toHaveURL(/\/topics\/economy#real-gdp-growth$/);
  await expect(
    page.getByRole("heading", { name: "Realni rast BDP-a", exact: true }),
  ).toBeVisible();
  if (published) {
    await expect(page.locator("#real-gdp-growth")).toContainText("Objavljena serija");
    await expect(page.locator("#real-gdp-growth").getByText("Tablični prikaz podataka")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Nema usporedivih podataka" }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("party cards open sourced profiles and can be found by abbreviation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", {
      name: "Socijaldemokratska partija Hrvatske",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/parties\/sdp$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Socijaldemokratska partija Hrvatske",
  );
  await expect(
    page.getByText("Siniša Hajdaš Dončić (Predsjednik)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Službeni izvor vodstva ↗" }),
  ).toHaveAttribute("href", "https://www.sdp.hr/clan/sinisa-hajdas-doncic/");
  await page.getByRole("searchbox").fill("SDP");
  await page.getByRole("searchbox").press("Enter");
  await expect(
    page.getByRole("link", { name: /Stranka Socijaldemokratska partija/ }),
  ).toBeVisible();
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
    "/parties/sdp",
    "/parties/mozemo",
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
