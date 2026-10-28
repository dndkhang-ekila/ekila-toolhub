import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const base = process.env.TEST_BASE_URL || "http://localhost:3104";
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  });
});
after(async () => {
  await browser?.close();
});

async function open(t, viewport = { width: 1366, height: 768 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  t.after(() => context.close());
  await page.goto(`${base}/url-check`);
  await page
    .getByRole("heading", { level: 1, name: "Kiểm tra trước khi rút gọn" })
    .waitFor();
  return page;
}
async function submit(page, url) {
  await page.getByLabel("Nhập URL gốc", { exact: true }).fill(url);
  await page.getByRole("button", { name: /Kiểm tra/ }).click();
}

test("blank input shows an accessible error and returns focus to the field", async (t) => {
  const page = await open(t);
  assert.equal(await page.locator("section [role=alert]").count(), 0);
  await page.getByRole("button", { name: "Kiểm tra liên kết" }).click();
  await page
    .getByText("Vui lòng nhập liên kết cần kiểm tra.", { exact: true })
    .waitFor();
  assert.equal(
    await page.locator("#original-url").getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page
      .locator("#original-url")
      .evaluate((el) => el === document.activeElement),
    true,
  );
});
test("a shortener is blocked without sending any backend or destination requests", async (t) => {
  const page = await open(t);
  let requestCount = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/api/") ||
      new URL(request.url()).hostname === "bit.ly"
    )
      requestCount++;
  });
  await submit(page, "https://bit.ly/3example");
  await page.locator("section [role=alert]").waitFor();
  assert.match(
    await page.locator("section [role=alert]").innerText(),
    /dịch vụ rút gọn khác/,
  );
  assert.match(
    await page.locator("section [role=alert]").innerText(),
    /bit.ly/,
  );
  assert.equal(requestCount, 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Rút gọn liên kết", exact: true })
      .count(),
    0,
  );
});
test("the current ToolHub hostname is blocked independently of port", async (t) => {
  const page = await open(t);
  await submit(page, `https://${new URL(base).hostname}:9999/a`);
  await page.locator("section [role=alert]").waitFor();
  assert.match(
    await page.locator("section [role=alert]").innerText(),
    /trỏ về ToolHub/,
  );
});
test("editing clears a stale error, and a normal URL produces a qualified result", async (t) => {
  const page = await open(t);
  await submit(page, "https://bit.ly/a");
  await page.locator("section [role=alert]").waitFor();
  await page
    .getByLabel("Nhập URL gốc")
    .fill("https://example.com/?source=bit.ly");
  assert.equal(await page.locator("section [role=alert]").count(), 0);
  await page.getByRole("button", { name: "Kiểm tra liên kết" }).click();
  await page.locator("section [role=status]").waitFor();
  assert.match(
    await page.locator("section [role=status]").innerText(),
    /Chưa phát hiện tên miền bị chặn/,
  );
  assert.match(
    await page.locator("section [role=status]").innerText(),
    /vẫn cần kiểm tra lại/,
  );
});
test("clear and enter-another actions reset the form and preserve keyboard focus", async (t) => {
  const page = await open(t);
  await submit(page, "https://tinyurl.com/a");
  await page.getByRole("button", { name: "Nhập link khác" }).click();
  assert.equal(await page.getByLabel("Nhập URL gốc").inputValue(), "");
  assert.equal(
    await page
      .locator("#original-url")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByLabel("Nhập URL gốc").fill("https://example.com/a");
  await page.getByRole("button", { name: "Xóa liên kết" }).click();
  assert.equal(await page.getByLabel("Nhập URL gốc").inputValue(), "");
});
test("mobile fits horizontally and retains usable controls", async (t) => {
  const page = await open(t, { width: 360, height: 800 });
  await submit(page, "https://very-long-subdomain-name.bit.ly/a");
  await page.locator("section [role=alert]").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  assert.ok(
    (await page.getByRole("button", { name: "Kiểm tra lại" }).boundingBox())
      .height >= 44,
  );
});
test("desktop form fits one viewport at 1366x768 and 1280x720", async (t) => {
  const page = await open(t);
  await submit(page, "https://bit.ly/3example");
  await page.locator("section [role=alert]").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight + 1,
    ),
    true,
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight + 1,
    ),
    true,
  );
});
