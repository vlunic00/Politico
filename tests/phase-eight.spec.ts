import { expect, test } from "@playwright/test";

test("production responses enforce security headers and health exposes no operational details", async ({ request }) => {
  for (const path of ["/", "/health", "/admin/operations"]) {
    const response = await request.get(path);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response.headers()["content-security-policy"]).toContain("form-action 'self'");
    expect(response.headers()["x-powered-by"]).toBeUndefined();
    if (path === "/health") {
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ status: "ok" });
      expect(response.headers()["cache-control"]).toContain("no-store");
    }
    if (path.startsWith("/admin")) {
      expect(response.status()).toBe(401);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(await response.text()).not.toContain("recordsPublished");
    }
  }
});

test("keyboard users can skip navigation and expand the chart's semantic data table", async ({ page }) => {
  await page.goto("/preview");
  const summary = page.getByText("Tablični prikaz podataka", { exact: true });
  await expect(summary).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Preskoči na sadržaj" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(summary).toBeVisible();
  // Walk through the controls from the skip-link target, using only Tab.
  for (let i = 0; i < 25 && !(await summary.evaluate((element) => element === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Space");
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  const tree = await table.ariaSnapshot();
  expect(tree).toContain('columnheader "Razdoblje"');
  expect(tree).toContain('columnheader "Hrvatska (primjer)"');
  expect(tree).toContain('cell "Nije dostupno"');
  await page.keyboard.press("Space");
  await expect(table).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("chart tables are server rendered and the deferred plot renders when in view", async ({ page, request }) => {
  const html = await (await request.get("/preview")).text();
  expect(html).toContain('<th scope="col"');
  expect(html).toContain("Nije dostupno");
  await page.goto("/preview");
  const chart = page.getByRole("figure");
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator(".recharts-wrapper > .recharts-surface")).toBeVisible();
});
