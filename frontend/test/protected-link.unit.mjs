import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('../node_modules/typescript');

function loadStorageModule(initialStorage = {}) {
  const store = new Map(Object.entries(initialStorage));
  const localStorageMock = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };

  let fakeNow = 1_700_000_000_000;
  const FakeDate = class extends Date {
    static now() {
      return fakeNow;
    }
  };

  const source = fs.readFileSync(
    new URL('../src/lib/protected-link-storage.ts', import.meta.url),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const mod = { exports: {} };
  const context = {
    module: mod,
    exports: mod.exports,
    window: { localStorage: localStorageMock },
    localStorage: localStorageMock,
    URL,
    TextEncoder,
    Uint8Array,
    crypto: globalThis.crypto,
    btoa: globalThis.btoa,
    Date: FakeDate,
  };

  vm.runInNewContext(compiled, context);

  return {
    ...mod.exports,
    store,
    advanceTime(ms) {
      fakeNow += ms;
    },
  };
}

function loadServiceModule(overrides = {}) {
  const storageExports = loadStorageModule();
  const savedLinks = [];

  const deps = {
    '@/lib/protected-link-storage': storageExports,
    '@/lib/url-shortener': {
      validateUrl: (raw) =>
        /^https?:\/\/.+\..+/i.test(raw)
          ? { isValid: true, sanitizedUrl: raw.trim() }
          : { isValid: false, error: 'errorInvalidUrl' },
      checkUrlSafetyApi: async () => ({ isSafe: true }),
      generateRandomSlug: () => 'Ab3XyZ',
      getRecentShortenedLinks: () => savedLinks,
      saveShortenedLink: (item) => {
        savedLinks.push(item);
        return savedLinks;
      },
      resolveShortUrl: async () => null,
      ...overrides.urlShortener,
    },
    '@/lib/link-api': {
      fetchLinks: async () => [],
      createShortLink: async () => ({
        link: {
          id: 'lnk_be_1',
          slug: 'k7m2p9x',
          originalUrl: 'https://docs.example.com/guide',
        },
        isDuplicate: false,
      }),
      resolveSlug: async () => ({ status: 'NOT_FOUND' }),
      ...overrides.linkApi,
    },
  };

  const source = fs.readFileSync(
    new URL('../src/lib/protected-link-service.ts', import.meta.url),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    module: mod,
    exports: mod.exports,
    require: (id) => deps[id] || require(id),
    window: { location: { origin: 'http://localhost:3000' } },
    Map,
    TypeError,
    Error,
    Date,
    Boolean,
  });

  return {
    ...mod.exports,
    storage: storageExports.protectedLinkStorage,
    savedLinks,
  };
}

test('[FR-URL-10] extractSlugFromInput: trích xuất slug chuẩn từ nhiều định dạng link', () => {
  const { extractSlugFromInput, isValidSlugFormat } = loadStorageModule();

  assert.equal(extractSlugFromInput('tai-lieu-bao-mat'), 'tai-lieu-bao-mat');
  assert.equal(extractSlugFromInput('  /s/Tai-Lieu-123  '), 'tai-lieu-123');
  assert.equal(extractSlugFromInput('http://localhost:3001/s/Bao-Cao?tab=1#top'), 'bao-cao');
  assert.equal(extractSlugFromInput('https://toolhub.id.vn/ekila-docs'), 'ekila-docs');
  assert.equal(extractSlugFromInput('localhost:3000/s/my_slug-9'), 'my_slug-9');
  assert.equal(extractSlugFromInput(''), '');
  assert.equal(extractSlugFromInput('   '), '');

  assert.equal(isValidSlugFormat('tai-lieu_2026'), true);
  assert.equal(isValidSlugFormat('bad slug!'), false);
  assert.equal(isValidSlugFormat(''), false);
});

test('[FR-URL-10] setPassword / isProtected / getMeta / removePassword hoạt động chính xác', async () => {
  const { protectedLinkStorage } = loadStorageModule();

  assert.equal(protectedLinkStorage.isProtected('secret-doc'), false);

  await protectedLinkStorage.setPassword('Secret-Doc', 'pass1234', 'https://example.com/secret');
  assert.equal(protectedLinkStorage.isProtected('secret-doc'), true);
  assert.equal(protectedLinkStorage.isProtected('SECRET-DOC'), true);

  const meta = protectedLinkStorage.getMeta('secret-doc');
  assert.ok(meta);
  assert.equal(meta.slug, 'secret-doc');
  assert.equal(meta.originalUrl, 'https://example.com/secret');
  assert.ok(meta.passwordHash && meta.passwordHash !== 'pass1234', 'Mật khẩu phải được băm SHA-256');

  // Cập nhật mật khẩu mới mà không truyền URL gốc phải giữ URL cũ
  await protectedLinkStorage.setPassword('secret-doc', 'newpass56');
  const updatedMeta = protectedLinkStorage.getMeta('secret-doc');
  assert.equal(updatedMeta.originalUrl, 'https://example.com/secret');

  protectedLinkStorage.removePassword('secret-doc');
  assert.equal(protectedLinkStorage.isProtected('secret-doc'), false);
  assert.equal(protectedLinkStorage.getMeta('secret-doc'), null);
});

test('[FR-URL-10] verifyPassword: đúng mật khẩu cho phép mở khóa & reset số lần thử sai', async () => {
  const { protectedLinkStorage } = loadStorageModule();
  await protectedLinkStorage.setPassword('doc-1', 'secret99', 'https://example.com/file');

  const wrong = await protectedLinkStorage.verifyPassword('doc-1', 'wrong');
  assert.equal(wrong.success, false);
  assert.equal(wrong.remainingAttempts, 4);

  const ok = await protectedLinkStorage.verifyPassword('Doc-1', '  secret99  ');
  assert.equal(ok.success, true);
  assert.equal(ok.originalUrl, 'https://example.com/file');

  assert.equal(protectedLinkStorage.getAttemptsData('Doc-1').count, 0);
});

test('[FR-URL-10] verifyPassword: sai 5 lần bị tạm khóa 30s và đồng bộ chuẩn chữ hoa/thường', async () => {
  const { protectedLinkStorage, advanceTime } = loadStorageModule();
  await protectedLinkStorage.setPassword('MixCaseSlug', 'abcd1234', 'https://example.com/target');

  for (let i = 1; i <= 4; i++) {
    const res = await protectedLinkStorage.verifyPassword('MixCaseSlug', 'wrong');
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 5 - i);
    assert.equal(res.lockedUntil, undefined);
  }

  // Lần sai thứ 5 -> lockout 30 giây
  const fifth = await protectedLinkStorage.verifyPassword('MixCaseSlug', 'wrong');
  assert.equal(fifth.success, false);
  assert.equal(fifth.remainingAttempts, 0);
  assert.ok(typeof fifth.lockedUntil === 'number');

  // getAttemptsData với chữ hoa vẫn phải thấy lockedUntil khớp
  const attempts = protectedLinkStorage.getAttemptsData('MixCaseSlug');
  assert.equal(attempts.lockedUntil, fifth.lockedUntil);

  // Trong thời gian khóa, kể cả nhập đúng mật khẩu vẫn bị từ chối
  const blockedCorrect = await protectedLinkStorage.verifyPassword('mixcaseslug', 'abcd1234');
  assert.equal(blockedCorrect.success, false);
  assert.ok(blockedCorrect.lockedUntil);

  // Sau 31 giây hết lockout -> mở khóa thành công
  advanceTime(31_000);
  const unlockedAfterCooldown = await protectedLinkStorage.verifyPassword('MixCaseSlug', 'abcd1234');
  assert.equal(unlockedAfterCooldown.success, true);
  assert.equal(unlockedAfterCooldown.originalUrl, 'https://example.com/target');
});

test('[FR-URL-10][BR-URL-02] protectShortLink: giải nén CreateLinkResult.link từ backend và từ chối slug < 3 ký tự', async () => {
  const { protectShortLink, storage } = loadServiceModule({
    linkApi: {
      createShortLink: async () => ({
        link: {
          id: 'lnk_be_dup',
          slug: 'ExistingSlug',
          originalUrl: 'https://docs.example.com/guide',
        },
        isDuplicate: true,
      }),
    },
  });

  await assert.rejects(
    () =>
      protectShortLink({
        slugInput: 'ab',
        originalUrlInput: 'https://docs.example.com/guide',
        password: 'pass1234',
      }),
    /3 đến 32 ký tự/,
  );

  const result = await protectShortLink({
    slugInput: '',
    originalUrlInput: 'https://docs.example.com/guide',
    password: 'pass1234',
  });

  assert.equal(result.slug, 'existingslug');
  assert.equal(result.isReusedDuplicate, true);
  assert.equal(storage.isProtected('existingslug'), true);
});

test('[FR-URL-10][BR-URL-01/03] trackUnlockAndResolveTarget: tôn trọng trạng thái DISABLED/EXPIRED của backend', async () => {
  const disabledService = loadServiceModule({
    linkApi: {
      resolveSlug: async () => ({ status: 'DISABLED' }),
    },
  });
  const resDisabled = await disabledService.trackUnlockAndResolveTarget(
    'old-landing',
    'https://old.landingpage.com/archive',
  );
  assert.equal(resDisabled.status, 'DISABLED');
  assert.equal(resDisabled.targetUrl, null);

  const expiredService = loadServiceModule({
    linkApi: {
      resolveSlug: async () => ({ status: 'EXPIRED' }),
    },
  });
  const resExpired = await expiredService.trackUnlockAndResolveTarget(
    'guest-expired',
    'https://guest.example.com',
  );
  assert.equal(resExpired.status, 'EXPIRED');
  assert.equal(resExpired.targetUrl, null);
});

test('[FR-URL-10] generateStrongLinkPassword: sinh mật khẩu độ dài chuẩn và không chứa ký tự dễ nhầm', () => {
  const { generateStrongLinkPassword } = loadStorageModule();
  const forbidden = ['0', 'O', '1', 'l', 'I'];

  for (let i = 0; i < 100; i++) {
    const pw = generateStrongLinkPassword(12);
    assert.equal(pw.length, 12);
    for (const ch of pw) {
      assert.equal(forbidden.includes(ch), false, `Unexpected confusable char ${ch}`);
    }
  }

  assert.equal(generateStrongLinkPassword(3).length, 6);
  assert.equal(generateStrongLinkPassword(64).length, 32);
});

test('[FR-URL-10] validateLinkPasswordPair: kiểm tra độ dài và xác nhận mật khẩu đồng nhất', () => {
  const { validateLinkPasswordPair } = loadStorageModule();

  assert.match(validateLinkPasswordPair('123', '123'), /tối thiểu 4 ký tự/);
  assert.match(validateLinkPasswordPair('1234', ''), /nhập lại mật khẩu/);
  assert.match(validateLinkPasswordPair('1234', '5678'), /không trùng khớp/);
  assert.equal(validateLinkPasswordPair('1234', '  1234  '), null);
  assert.equal(validateLinkPasswordPair('1234', '', false), null);
});
