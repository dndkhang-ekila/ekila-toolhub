import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);

let browser;
const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
const apiPattern = "**/api/v1/auth/**";

before(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  });
});

after(async () => {
  await browser?.close();
});

async function pageFor(t, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  t.after(() => context.close());
  return page;
}

async function reply(route, status, body, extra = {}) {
  await route.fulfill({
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Retry-After",
      ...extra,
    },
    ...(body === undefined
      ? {}
      : { contentType: "application/json", body: JSON.stringify(body) }),
  });
}

async function heading(page, text) {
  await page
    .getByRole("heading", { level: 1, name: text, exact: true })
    .waitFor();
}

async function screenshot(page, name) {
  if (!process.env.TEST_SCREENSHOT_DIR) return;
  await fs.mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(process.env.TEST_SCREENSHOT_DIR, name),
    fullPage: true,
  });
}

test("login and password recovery retain separate layouts and navigation", async (t) => {
  const page = await pageFor(t);
  await page.goto(`${baseUrl}/login`);
  await heading(page, "Đăng nhập vào ToolHub");
  assert.equal(await page.getByRole("main").count(), 1);
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  await page.getByRole("link", { name: "Quên mật khẩu?", exact: true }).click();
  await heading(page, "Quên mật khẩu?");
  assert.equal(new URL(page.url()).pathname, "/forgot-password");
  assert.equal(await page.getByRole("main").count(), 1);
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  await page.getByRole("link", { name: "Quay lại đăng nhập", exact: true }).click();
  await heading(page, "Đăng nhập vào ToolHub");
  await page.getByRole("link", { name: "Đăng ký ngay", exact: true }).click();
  await page.waitForURL(`${baseUrl}/register`);
  assert.equal(new URL(page.url()).pathname, "/register");
  await page.getByRole("heading", { level: 1 }).waitFor();
  assert.equal(await page.getByRole("main").count(), 1);
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
});
test("forgot password validates email without sending an API request", async (t) => {
  const page = await pageFor(t, { viewport: { width: 1440, height: 1000 } });
  let calls = 0;
  await page.route(apiPattern, async (route) => {
    calls++;
    await reply(route, 503);
  });
  await page.goto(`${baseUrl}/forgot-password`);
  await heading(page, "Quên mật khẩu?");
  await screenshot(page, "fr-acc-03-forgot-desktop.png");
  await page.getByRole("button", { name: "Gửi liên kết", exact: true }).click();
  await page.getByText("Nhập địa chỉ email hợp lệ.", { exact: true }).waitFor();
  assert.equal(calls, 0);
  assert.equal(
    await page.locator("#reset-email").getAttribute("aria-invalid"),
    "true",
  );
});

test("an unavailable backend never shows a sent-email success state", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) => reply(route, 404));
  await page.goto(`${baseUrl}/forgot-password`);
  await page.getByLabel("Địa chỉ email").fill("dat@example.com");
  await page.getByRole("button", { name: "Gửi liên kết", exact: true }).click();
  await page.locator('form [role="alert"]').waitFor();
  assert.match(
    await page.locator('form [role="alert"]').innerText(),
    /chưa khả dụng/,
  );
  assert.equal(
    await page
      .getByRole("heading", { level: 1, name: "Kiểm tra email của bạn" })
      .count(),
    0,
  );
});

test("request acceptance uses neutral copy and the server resend delay", async (t) => {
  const page = await pageFor(t);
  let calls = 0;
  await page.route(apiPattern, async (route) => {
    calls++;
    assert.deepEqual(route.request().postDataJSON(), {
      email: "dat@example.com",
    });
    await reply(route, 202, undefined, { "Retry-After": "60" });
  });
  await page.goto(`${baseUrl}/forgot-password`);
  await page.getByLabel("Địa chỉ email").fill("dat@example.com");
  await page.getByRole("button", { name: "Gửi liên kết", exact: true }).click();
  await heading(page, "Kiểm tra email của bạn");
  assert.equal(
    await page.getByRole("button", { name: /Gửi lại sau/ }).isDisabled(),
    true,
  );
  await page
    .getByText(/Nếu email này liên kết với tài khoản đủ điều kiện/)
    .waitFor();
  assert.equal(calls, 1);
});

test("forgot-password rate limiting blocks repeated submissions", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) =>
    reply(route, 429, undefined, { "Retry-After": "60" }),
  );
  await page.goto(`${baseUrl}/forgot-password`);
  await page.getByLabel("Địa chỉ email").fill("dat@example.com");
  await page.getByRole("button", { name: "Gửi liên kết", exact: true }).click();
  await page.locator('form [role="alert"]').waitFor();
  assert.equal(
    await page.getByRole("button", { name: /Gửi lại sau/ }).isDisabled(),
    true,
  );
});

test("missing or duplicate tokens cannot open the password form", async (t) => {
  const page = await pageFor(t);
  let calls = 0;
  await page.route(apiPattern, async (route) => {
    calls++;
    await reply(route, 200, { valid: true });
  });
  for (const suffix of ["", "?token=sample-one&token=sample-two"]) {
    await page.goto(`${baseUrl}/reset-password${suffix}`);
    await heading(page, "Liên kết không còn hiệu lực");
    assert.equal(await page.locator("#new-password").count(), 0);
  }
  assert.equal(calls, 0);
});

test("an expired token shows a new-link action without a password form", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) =>
    reply(route, 400, { error: { code: "RESET_LINK_INVALID" } }),
  );
  await page.goto(`${baseUrl}/reset-password?token=sample-expired`);
  await heading(page, "Liên kết không còn hiệu lực");
  assert.equal(
    await page
      .getByRole("link", { name: /Yêu cầu liên kết mới/ })
      .getAttribute("href"),
    "/forgot-password",
  );
});

test("an unexpected successful validation response does not authorize the form", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) => reply(route, 200, { valid: false }));
  await page.goto(`${baseUrl}/reset-password?token=sample-invalid-response`);
  await heading(page, "Chưa thể kiểm tra liên kết");
  assert.equal(await page.locator("#new-password").count(), 0);
});

test("reset checks matching passwords, toggles visibility and clears token on success", async (t) => {
  const page = await pageFor(t);
  let resets = 0;
  await page.route(apiPattern, async (route) => {
    if (route.request().url().endsWith("/validate"))
      return reply(route, 200, { valid: true });
    resets++;
    assert.deepEqual(route.request().postDataJSON(), {
      token: "sample-reset-token",
      newPassword: "Example-password-2026",
    });
    await reply(route, 204);
  });
  await page.goto(`${baseUrl}/reset-password?token=sample-reset-token`);
  await heading(page, "Đặt lại mật khẩu");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("Example-password-2026");
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("Different");
  await page
    .getByText("Mật khẩu xác nhận chưa khớp.", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Lưu mật khẩu mới" }).isDisabled(),
    true,
  );
  assert.equal(resets, 0);
  await page
    .getByRole("button", { name: "Hiện mật khẩu", exact: true })
    .first()
    .click();
  assert.equal(
    await page.locator("#new-password").getAttribute("type"),
    "text",
  );
  await page
    .getByLabel("Xác nhận mật khẩu", { exact: true })
    .fill("Example-password-2026");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await heading(page, "Mật khẩu đã được cập nhật");
  await page.waitForURL(`${baseUrl}/reset-password`);
  assert.equal(resets, 1);
  assert.equal(await page.locator('input[type="password"]').count(), 0);
});

test("a token that expires after validation is still rejected on submission", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) =>
    route.request().url().endsWith("/validate")
      ? reply(route, 200, { valid: true })
      : reply(route, 400, { error: { code: "RESET_LINK_INVALID" } }),
  );
  await page.goto(`${baseUrl}/reset-password?token=sample-expiring`);
  await heading(page, "Đặt lại mật khẩu");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("Example-password-2026");
  await page
    .getByLabel("Xác nhận mật khẩu", { exact: true })
    .fill("Example-password-2026");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await heading(page, "Liên kết không còn hiệu lực");
});

test("token validation honors rate-limit cooldown", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) =>
    reply(route, 429, undefined, { "Retry-After": "60" }),
  );
  await page.goto(`${baseUrl}/reset-password?token=sample-limited`);
  await heading(page, "Chưa thể kiểm tra liên kết");
  assert.equal(
    await page.getByRole("button", { name: /Gửi lại sau/ }).isDisabled(),
    true,
  );
});

test("mobile layout fits 360px and supports language switching", async (t) => {
  const page = await pageFor(t, {
    viewport: { width: 360, height: 800 },
    colorScheme: "dark",
  });
  await page.route(apiPattern, (route) => reply(route, 200, { valid: true }));
  await page.goto(`${baseUrl}/reset-password?token=sample-mobile`);
  await heading(page, "Đặt lại mật khẩu");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("Example-password-2026");
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("Different");
  await screenshot(page, "fr-acc-03-reset-mobile.png");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  assert.equal(
    await page
      .locator("section")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(255, 255, 255)",
  );
  await page.getByLabel("Ngôn ngữ", { exact: true }).selectOption("en");
  await heading(page, "Reset your password");
  await page
    .getByText("The passwords do not match.", { exact: true })
    .waitFor();
});

test("password policy errors preserve the form without showing server text", async (t) => {
  const page = await pageFor(t);
  await page.route(apiPattern, (route) =>
    route.request().url().endsWith("/validate")
      ? reply(route, 200, { valid: true })
      : reply(route, 422, {
          error: {
            code: "PASSWORD_POLICY_VIOLATION",
            message: "sensitive internal data",
          },
        }),
  );
  await page.goto(`${baseUrl}/reset-password?token=sample-policy`);
  await heading(page, "Đặt lại mật khẩu");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("Example");
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("Example");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await page.locator('form [role="alert"]').waitFor();
  assert.match(
    await page.locator('form [role="alert"]').innerText(),
    /chính sách tài khoản/,
  );
  assert.equal(await page.getByText("sensitive internal data").count(), 0);
  assert.equal(await page.locator("#new-password").inputValue(), "Example");
});
