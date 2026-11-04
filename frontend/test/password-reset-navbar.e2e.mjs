import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href : "playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const cases = [{ path: "/forgot-password", label: "Địa chỉ email", value: "header@example.test", heading: "Forgot your password?", enLabel: "Email address" }, { path: "/reset-password?token=sample-shared-navbar", label: "Mật khẩu mới", value: "Demo-password-2026", heading: "Reset your password", enLabel: "New password" }];
let browser;
before(async () => { browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }); });
after(async () => { await browser?.close(); });
async function pageFor(t) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: "light" });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.route("**/api/v1/auth/**", route => route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ valid: true }) }));
  return page;
}
test("task pages render one shared Navbar and fit desktop and mobile", async t => {
  const page = await pageFor(t);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport);
    for (const item of cases) {
      await page.goto(base + item.path);
      await page.getByLabel(item.label, { exact: true }).waitFor();
      assert.equal(await page.getByRole("banner").count(), 1);
      assert.equal(await page.getByRole("main").getByRole("banner").count(), 0);
      assert.equal(await page.getByRole("banner").getByRole("button", { name: "Chọn ngôn ngữ hiển thị" }).count(), 1);
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight }));
      assert.ok(dimensions.width <= dimensions.w, JSON.stringify({ path: item.path, viewport, dimensions }));
      if (viewport.width > 900) assert.ok(dimensions.height <= dimensions.h + 1, JSON.stringify({ path: item.path, viewport, dimensions }));
    }
  }
  assert.deepEqual(errors, []);
});
test("shared Navbar language switching preserves task form values", async t => {
  const page = await pageFor(t);
  for (const item of cases) {
    await page.goto(base + item.path);
    await page.getByLabel(item.label, { exact: true }).fill(item.value);
    await page.getByRole("banner").getByRole("button", { name: "Chọn ngôn ngữ hiển thị" }).click();
    await page.getByRole("option", { name: /English/ }).click();
    await page.getByRole("heading", { name: item.heading, exact: true }).waitFor();
    assert.equal(await page.getByLabel(item.enLabel, { exact: true }).inputValue(), item.value);
    await page.getByRole("banner").getByRole("button", { name: "Select display language" }).click();
    await page.getByRole("option", { name: /Tiếng Việt/ }).click();
  }
});
