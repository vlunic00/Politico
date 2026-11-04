import { expect, test, request as requestFactory } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixtureSummary } from "../src/lib/parties/summary-fixture";

test("editorial routes fail closed for anonymous requests", async () => {
  const anonymous = await requestFactory.newContext({ baseURL: "http://127.0.0.1:3101", httpCredentials: { username: "anonymous", password: "invalid", send: "always" } });
  try {
    for (const path of ["/admin/summaries", "/admin/summaries/unknown", "/admin/corrections"]) {
      const response = await anonymous.get(path);
      expect(response.status()).toBe(401); expect(response.headers()["www-authenticate"]).toContain("Basic");
      expect(await response.text()).not.toContain("Synthetic");
    }
    expect((await anonymous.post("/admin/summaries/unknown/review")).status()).toBe(401);
    expect((await anonymous.post("/admin/corrections/unknown/review")).status()).toBe(401);
  } finally { await anonymous.dispose(); }
});

test("public corrections stay private until a reviewer records an applied correction with public evidence", async ({ page, browser, request }, testInfo) => {
  const claim = `Private synthetic ${testInfo.project.name} claim: displayed amount differs.`;
  await page.goto("/corrections?page=/accountability%23financing");
  await page.getByLabel("Sporna tvrdnja").fill(claim);
  await page.getByLabel("Predloženi ispravak").fill("Private synthetic proposal: use the verified official amount.");
  await page.getByLabel("Poveznica na dokaz").fill("https://www.sabor.hr/synthetic");
  await page.getByRole("button", { name: "Pošalji prijavu" }).click();
  await expect(page.getByRole("status")).toContainText("Prijava je spremljena");
  await expect(page.getByRole("main")).not.toContainText(claim);
  const validForm = { pagePath: "/accountability", claim, proposed: "Synthetic corrected amount with official evidence.", evidenceUrl: "https://www.sabor.hr/synthetic" };
  expect((await request.post("/corrections/submit", { form: validForm, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await request.post("/corrections/submit", { form: validForm })).status()).toBe(403);
  expect((await request.post("/corrections/submit", { data: "x".repeat(24001), headers: { origin: "http://127.0.0.1:3101", "content-type": "application/x-www-form-urlencoded" } })).status()).toBe(413);
  await page.goto("/admin/corrections");
  const entry = page.getByRole("article").filter({ hasText: claim });
  const action = await entry.locator("form").getAttribute("action");
  const editor = await browser.newContext({ baseURL: "http://127.0.0.1:3101", httpCredentials: { username: "test-editor", password: "isolated-browser-fixture-token-not-for-real-use-12345", send: "always" } });
  try {
    expect((await editor.request.post(action!, { form: { action: "ACCEPTED" }, headers: { origin: "http://127.0.0.1:3101" } })).status()).toBe(403);
  } finally { await editor.close(); }
  await entry.getByLabel("Privatna bilješka").fill("Private synthetic review after applying the fixture correction.");
  const summary = `Synthetic ${testInfo.project.name}: corrected the fixture amount using the official record.`;
  await entry.getByLabel("Javno objašnjenje promjene").fill(summary);
  await entry.getByLabel("Provjereni izvor", { exact: true }).fill("https://www.sabor.hr/synthetic");
  await entry.getByRole("button", { name: "Prihvati i objavi objašnjenje" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Odluka nije spremljena");
  await entry.getByLabel("Privatna bilješka").fill("Private synthetic review after applying the fixture correction.");
  await entry.getByLabel("Javno objašnjenje promjene").fill(summary);
  await entry.getByLabel("Provjereni izvor", { exact: true }).fill("https://www.sabor.hr/synthetic");
  await entry.getByLabel("Provjerio/la sam izvor i već primijenio/la").check();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await entry.getByRole("button", { name: "Prihvati i objavi objašnjenje" }).click();
  await expect(page.getByRole("status")).toContainText("Odluka je spremljena");
  await page.goto("/corrections");
  await expect(page.getByRole("main")).toContainText(summary);
  await expect(page.getByRole("main")).not.toContainText(claim);
  await expect(page.getByRole("main")).not.toContainText("Private synthetic review");
  await expect(page.getByRole("main")).not.toContainText("fixture-reviewer");
});

test("a human reviewer publishes a Croatian draft after evidence checks; editor, CSRF and stale edits cannot bypass review", async ({ page, browser, request }, testInfo) => {
  const party = testInfo.project.name === "desktop" ? "registar-1000" : "registar-1001";
  await page.goto(`/parties/${party}`);
  await expect(page.getByText("Nema odobrenog AI sažetka za ovu verziju programa.")).toBeVisible();
  await expect(page.getByRole("region", { name: /^Odobreni AI/ })).toHaveCount(0);
  await page.goto("/admin/summaries");
  await page.getByRole("link", { name: new RegExp(`^Synthetic ${testInfo.project.name} document`) }).click();
  await expect(page).toHaveURL(/\/admin\/summaries\/[a-z0-9]{20,40}$/);
  const reviewPath = new URL(page.url()).pathname;
  const mutationPath = `${reviewPath}/review`;
  const form = { revision: "1", action: "approve", content: JSON.stringify(fixtureSummary()), note: "Synthetic review", sourceChecked: "on", croatianChecked: "on", coverageChecked: "on" };
  expect((await request.post(mutationPath, { form, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await request.post(mutationPath, { form })).status()).toBe(403);
  const editor = await browser.newContext({ baseURL: "http://127.0.0.1:3101", httpCredentials: { username: "test-editor", password: "isolated-browser-fixture-token-not-for-real-use-12345", send: "always" } });
  const editorPage = await editor.newPage();
  try {
    await editorPage.goto(reviewPath);
    await expect(editorPage.getByRole("button", { name: "Odobri i objavi" })).toHaveCount(0);
    const unauthorizedApproval = await editor.request.post(mutationPath, { form, headers: { origin: "http://127.0.0.1:3101" }, maxRedirects: 0 });
    expect(unauthorizedApproval.status()).toBe(303); expect(unauthorizedApproval.headers().location).toContain("result=invalid");
    const revised = fixtureSummary(); revised.sections.find((section) => section.topic === "housing")!.proposals[0].text = `Prema programu: ${revised.sections.find((section) => section.topic === "housing")!.proposals[0].text}`;
    await editorPage.getByLabel("Sadržaj sažetka · JSON").fill(JSON.stringify(revised, null, 2));
    await editorPage.getByLabel("Urednička bilješka").fill("Provjeren sintetički navod; uređeno pripisivanje programu.");
    await editorPage.getByRole("button", { name: "Spremi nacrt" }).click();
    await expect(editorPage.getByRole("status")).toContainText("Promjena je spremljena");
    const stale = await editor.request.post(mutationPath, { form: { ...form, action: "save" }, headers: { origin: "http://127.0.0.1:3101" }, maxRedirects: 0 });
    expect(stale.headers().location).toContain("result=invalid");
  } finally { await editor.close(); }
  await page.goto(reviewPath);
  await page.getByLabel("Urednička bilješka").fill("Provjera bez potvrda ne smije objaviti nacrt.");
  await page.getByRole("button", { name: "Odobri i objavi" }).click();
  await expect(page.getByRole("status")).toContainText("Promjena nije spremljena");
  await page.getByLabel("Urednička bilješka").fill("Provjereni izvor, hrvatski jezik i obuhvat sintetičkog dokumenta.");
  await page.getByLabel("Provjerio/la sam izvornik", { exact: false }).check();
  await page.getByLabel("Provjerio/la sam da je tekst", { exact: false }).check();
  await page.getByLabel("Provjerio/la sam obuhvat", { exact: false }).check();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.data/editorial-test-results/review-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Odobri i objavi" }).click();
  await expect(page.getByRole("status")).toContainText("Promjena je spremljena");
  await expect(page.getByRole("button", { name: "Odobri i objavi" })).toHaveCount(0);
  await expect(page.getByText(/test-editor · editor · save/)).toBeVisible();
  await expect(page.getByText(/test-reviewer · reviewer · approve/)).toBeVisible();
  await page.goto(`/parties/${party}`);
  const summary = page.getByRole("region", { name: "Odobreni AI sažetak 1" });
  await expect(summary).toContainText("AI sažetak · hrvatski");
  await expect(summary).toContainText("Prema programu:");
  await summary.getByText("Dokaz · PDF str. 1", { exact: true }).click();
  await expect(summary.getByRole("link", { name: "Izvorni program · PDF str. 1" })).toHaveAttribute("href", "https://example.org/synthetic.pdf#page=1");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.data/editorial-test-results/approved-summary-${testInfo.project.name}.png`, fullPage: true });
  await page.goto(`/compare/parties?party=${party}&context=parliamentary-2024`);
  await expect(page.getByRole("row", { name: /^Stanovanje/ })).toContainText("Prema programu:");
  await expect(page.getByRole("row", { name: /^AI sažetak/ })).toContainText("Hrvatski · izdanje 1");
});
