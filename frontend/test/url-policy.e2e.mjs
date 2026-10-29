import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3110";
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
test("a shortener is blocked by the real backend without browser destination requests", async (t) => {
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
  assert.equal(requestCount, 1);
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
  await page
    .getByRole("heading", { name: "Chưa phát hiện tên miền bị chặn" })
    .waitFor();
  assert.match(
    await page.locator("section [role=status]").innerText(),
    /Chưa phát hiện tên miền bị chặn/,
  );
  assert.match(
    await page.locator("section [role=status]").innerText(),
    /vẫn cần kiểm tra lại/,
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
    true,
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

test("503 never becomes an allowed result and supports retry", async (t) => {
  const page = await open(t);
  await page.route("**/url-policy/check", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "URL_VERIFICATION_FAILED" } }),
    }),
  );
  await submit(page, "https://example.com/");
  await page
    .getByRole("heading", { name: "Chưa thể xác minh liên kết" })
    .waitFor();
  assert.equal(await page.locator("section [role=status]").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Kiểm tra lại" }).isEnabled(),
    true,
  );
});

test("429 displays the server retry delay", async (t) => {
  const page = await open(t);
  await page.route("**/url-policy/check", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: {
        "Retry-After": "45",
        "Access-Control-Expose-Headers": "Retry-After",
      },
      body: JSON.stringify({ error: { code: "RATE_LIMITED" } }),
    }),
  );
  await submit(page, "https://example.com/");
  await page.getByText(/thử lại sau 45 giây/).waitFor();
});

test("redirect rejection is displayed as a blocked URL", async (t) => {
  const page = await open(t);
  await page.route("**/url-policy/check", (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "REDIRECT_TARGET_NOT_ALLOWED",
          reason: "SHORTENER_DOMAIN_NOT_ALLOWED",
        },
      }),
    }),
  );
  await submit(page, "https://example.com/");
  await page
    .getByText(/chuyển hướng đến tên miền hoặc địa chỉ không được phép/)
    .waitFor();
  assert.equal(
    await page.locator("#original-url").getAttribute("aria-invalid"),
    "true",
  );
});

test("network errors and malformed 200 responses never show approval", async (t) => {
  const page = await open(t);
  await page.route("**/url-policy/check", (route) => route.abort("failed"));
  await submit(page, "https://example.com/");
  await page
    .getByRole("heading", { name: "Chưa thể xác minh liên kết" })
    .waitFor();
  await page.unroute("**/url-policy/check");
  await page.route("**/url-policy/check", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"allowed":true}',
    }),
  );
  await page.getByRole("button", { name: "Kiểm tra lại" }).click();
  await page
    .getByRole("heading", { name: "Chưa thể xác minh liên kết" })
    .waitFor();
  assert.equal(await page.locator("section [role=status]").count(), 0);
});

test("editing cancels a pending check and discards its stale result", async (t) => {
  const page = await open(t);
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  let entered;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  await page.route("**/url-policy/check", async (route) => {
    entered();
    await waiting;
    await route
      .fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "SHORTENER_DOMAIN_NOT_ALLOWED" },
        }),
      })
      .catch(() => {});
  });
  await submit(page, "https://bit.ly/old");
  await started;
  assert.equal(
    await page.getByRole("button", { name: "Đang kiểm tra…" }).isDisabled(),
    true,
  );
  await page
    .getByLabel("Nhập URL gốc", { exact: true })
    .fill("https://example.com/new");
  release();
  await page.waitForTimeout(150);
  assert.equal(await page.locator("section [role=alert]").count(), 0);
  assert.equal(await page.locator("section [role=status]").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Kiểm tra liên kết" }).isEnabled(),
    true,
  );
});
