import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("election history filters and parliamentary results retain official seats, lists and minority rules", async ({ page }) => {
  await page.goto("/elections");
  const history = page.getByRole("region", { name: "Povijest izbora" });
  await expect(history.getByRole("article")).toHaveCount(5);
  await page.getByLabel("Vrsta izbora").selectOption("parliamentary");
  await page.getByLabel("Godina glasovanja").selectOption("2024");
  await page.getByRole("button", { name: "Filtriraj izbore" }).click();
  await expect(history.getByRole("article")).toHaveCount(1);
  await page.getByRole("link", { name: "Parlamentarni izbori 2024.", exact: true }).click();
  await expect(page.getByText("Ukupno verificiranih mandata: 151.", { exact: false })).toBeVisible();
  const table = page.getByRole("table", { name: /^Glasovi, udjeli i mandati/ });
  const hdz = table.getByRole("row").filter({ hasText: "HDZ, HSLS, HDS, HNS, HSU" });
  await expect(hdz).toContainText("63.763");
  await expect(hdz.getByRole("cell").last()).toHaveText("5");
  await hdz.getByText("Sastav liste i kandidati", { exact: true }).click();
  await expect(hdz).toContainText("ANDREJ PLENKOVIĆ");
  await expect(hdz).toContainText("izabran/a prema službenoj odluci");
  await page.getByLabel("Izborna jedinica / područje").selectOption("012-13");
  await page.getByRole("button", { name: "Prikaži izborne rezultate" }).click();
  await expect(page.getByRole("region", { name: "Izborna izlaznost" })).toContainText("Ne prikazuje se za ovaj manjinski obuhvat");
  await expect(page.getByRole("region", { name: "Izborna izlaznost" })).toContainText("do tri kandidata");
  await expect(table).toContainText("MILORAD PUPOVAC");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.goto("/elections/parlamentarni-2024?contest=999");
  await expect(page.getByRole("alert").filter({ hasText: "Nevaljan izbor" })).toBeVisible();
});

test("European and presidential results keep national/county scopes and round denominators distinct", async ({ page }, testInfo) => {
  await page.goto("/elections/europski-2024");
  await expect(page.getByText("Ukupno verificiranih mandata: 12.", { exact: false })).toBeVisible();
  const table = page.getByRole("table", { name: /^Glasovi, udjeli i mandati/ });
  await expect(table).toContainText("256.295");
  await page.getByLabel("Izborna jedinica / područje").selectOption("21");
  await page.getByRole("button", { name: "Prikaži izborne rezultate" }).click();
  await expect(page.getByRole("region", { name: "Izborna izlaznost" })).toContainText("GRAD ZAGREB");
  await expect(page).toHaveURL(/contest=21/);
  await page.reload();
  await expect(page.getByLabel("Izborna jedinica / područje")).toHaveValue("21");
  await page.goto("/elections/predsjednicki-2024-1");
  await expect(page.getByRole("region", { name: "Izborna izlaznost" })).toContainText("prema pristupilim biračima");
  await expect(table.getByRole("row").filter({ hasText: "ZORAN MILANOVIĆ" })).toContainText("49,09 %");
  await page.goto("/elections/predsjednicki-2024-2");
  await expect(table.getByRole("row").filter({ hasText: "ZORAN MILANOVIĆ" })).toContainText("74,68 %");
  await expect(page.getByRole("region", { name: "Izborna izlaznost" })).toContainText("prema važećim listićima");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/election-results-${testInfo.project.name}.png`, fullPage: true });
});

test("all counties have map links and exact-year comparisons, profiles and sourced histories", async ({ page }, testInfo) => {
  await page.goto("/regions");
  const map = page.getByRole("group", { name: "Klikabilna karta 20 županija i Grada Zagreba" });
  await expect(map.getByRole("link")).toHaveCount(21);
  const table = page.getByRole("table", { name: /^Županijske vrijednosti/ });
  await expect(table.getByRole("row")).toHaveCount(22);
  await expect(table.getByRole("row", { name: /^Grad Zagreb/ })).toContainText("37.500");
  await page.getByLabel("Županija za usporedbu 1").selectOption("HR050");
  await page.getByLabel("Županija za usporedbu 2").selectOption("HR065");
  await page.getByLabel("Referentna godina").selectOption("2023");
  await page.getByRole("button", { name: "Prikaži regionalne podatke" }).click();
  await expect(table.getByRole("row", { name: /^Grad Zagreb/ })).toContainText("34.500");
  await expect(page.getByRole("heading", { name: "Grad Zagreb · povijest" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Županija za usporedbu 2")).toHaveValue("HR065");
  await page.getByRole("figure", { name: "Grad Zagreb · BDP po stanovniku", exact: true }).locator("div.h-72").scrollIntoViewIfNeeded();
  await expect(page.locator(".recharts-wrapper svg").first()).toBeVisible();
  await page.getByLabel("Regionalni pokazatelj").selectOption("regional-migration-adjusted");
  await expect(page.getByLabel("Regionalni pokazatelj")).toHaveValue("regional-migration-adjusted");
  await page.getByLabel("Referentna godina").selectOption("2024");
  await page.getByRole("button", { name: "Prikaži regionalne podatke" }).click();
  await expect(page.getByRole("region", { name: "Stanje regionalnih podataka" })).toContainText("nije izravan broj doseljenih minus odseljenih");
  await expect(table.getByRole("row", { name: /^Grad Zagreb/ })).toContainText("7.010");
  await expect(table.getByRole("row", { name: /^Zagrebačka županija/ })).toContainText("4.814");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/county-comparison-${testInfo.project.name}.png`, fullPage: true });
  await map.getByRole("link", { name: /^Grad Zagreb:/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grad Zagreb");
  await expect(page.getByRole("heading", { name: "Grad Zagreb · povijest" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.goto("/regions?county=HR050&county=HR050");
  await expect(page.getByRole("alert").filter({ hasText: "Nevaljan odabir" })).toBeVisible();
  await page.goto("/regions?metric=regional-migration-adjusted");
  await expect(page.getByLabel("Referentna godina")).toHaveValue("2024");
  await expect(page.getByLabel("Referentna godina").getByRole("option", { name: "2025", exact: true })).toHaveCount(0);
});

test("elections and counties are searchable, party evidence is linked, and unknown details stay real 404s", async ({ page }) => {
  await page.goto("/search?q=istarska+zupanija");
  await page.getByRole("link", { name: /Županija Istarska županija/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Istarska županija");
  await page.goto("/search?q=parlamentarni+izbori+2024");
  await page.getByRole("link", { name: /Izbori Parlamentarni izbori 2024/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Parlamentarni izbori 2024.");
  await page.goto("/parties/domovinski-pokret");
  await page.getByText("Verificirane povijesne kandidacijske liste i predlagatelji", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Pregled izbora" }).first()).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Parlamentarni izbori 2020.");
  for (const path of ["/elections/unknown", "/regions/unknown"]) {
    expect((await page.goto(path))?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Stranica nije pronađena" })).toBeVisible();
  }
});
