import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(relativePath, extraExports = {}) {
  const filePath = new URL(relativePath, import.meta.url);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const testModule = { exports: {} };
  const customRequire = (specifier) => {
    if (specifier.includes('internal-blocklist')) {
      return extraExports.internalBlocklist;
    }
    if (specifier.includes('malicious-url-service')) {
      return extraExports.maliciousUrlService;
    }
    return {};
  };

  vm.runInNewContext(
    compiled,
    {
      module: testModule,
      exports: testModule.exports,
      require: customRequire,
      URL,
      process,
    },
  );

  return testModule.exports;
}

const internalBlocklist = loadModule(
  '../src/features/url-safety/lib/internal-blocklist.ts',
);
const maliciousUrlService = loadModule(
  '../src/features/url-safety/lib/malicious-url-service.ts',
);
const { checkUrlSafety } = loadModule(
  '../src/features/url-safety/lib/check-url-safety.ts',
  { internalBlocklist, maliciousUrlService },
);

test('AC1 (Given/When/Then): Rejects destination URL when present in internal blocklist', async () => {
  const blockedUrls = [
    'https://phishing-bank-login.com/login',
    'https://sub.phishing-bank-login.com/account',
    'http://free-nitro-scam.xyz/claim',
    'https://darkweb-market.cc/buy',
    'https://account-verify-fake.com/step1',
    'https://evil-payload.ru/script.js',
  ];

  for (const url of blockedUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'INTERNAL_BLOCKLIST');
    assert.match(result.reason, /danh sách chặn bảo mật nội bộ/);
  }
});

test('AC2 (Given/When/Then): Rejects destination URL flagged as malware by security service', async () => {
  const malwareUrls = [
    'https://malware-test.com/sample',
    'http://virus-download.top/setup.exe',
    'https://trojan-dropper.cc/payload',
    'http://ransomware.biz/lock',
  ];

  for (const url of malwareUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'MALICIOUS_MALWARE');
    assert.match(result.reason, /mã độc hại|Malware/);
  }
});

test('AC3 (Given/When/Then): Rejects destination URL flagged as phishing by security service', async () => {
  const phishingUrls = [
    'https://phishing-bank.com/secure',
    'http://paypal-login-verify.info/signin',
  ];

  for (const url of phishingUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'MALICIOUS_PHISHING');
    assert.match(result.reason, /lừa đảo|Phishing/);
  }
});

test('AC4: Rejects direct IP address URLs to prevent SSRF and unverified network calls', async () => {
  const ipUrls = [
    'http://192.168.1.1/admin',
    'https://10.0.0.1/status',
    'http://127.0.0.1:8080/dashboard',
    'http://8.8.8.8/test',
  ];

  for (const url of ipUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'DIRECT_IP_DISALLOWED');
    assert.match(result.reason, /địa chỉ IP trực tiếp/);
  }
});

test('AC5: Rejects loopback to ToolHub domain and known secondary shorteners', async () => {
  const loopbackUrls = [
    'https://toolhub.id.vn/abc',
    'https://sub.toolhub.id.vn/test',
    'https://bit.ly/sample',
    'https://tinyurl.com/xyz',
    'https://t.co/12345',
  ];

  for (const url of loopbackUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.ok(
      result.kind === 'TOOLHUB_DOMAIN' || result.kind === 'LOOPBACK_SHORTENER',
    );
  }
});

test('AC6: Rejects malformed, overly long, or non-http(s) URLs', async () => {
  const invalidUrls = [
    '',
    '   ',
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'file:///C:/Users/test.txt',
    'https://user:password@example.com',
    'https://example.com/has space in path',
    'https://example.com/' + 'a'.repeat(2048),
  ];

  for (const url of invalidUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'INVALID_FORMAT');
  }
});

test('AC7: Allows legitimate, safe URLs and preserves normalized destination', async () => {
  const safeUrls = [
    'https://google.com',
    'https://github.com/dndkhang-ekila/ekila-toolhub',
    'https://developer.mozilla.org/en-US/docs/Web/API/URL',
    'https://wikipedia.org/wiki/Shortlink',
    'http://example.com/test-page?param=1&filter=safe',
  ];

  for (const url of safeUrls) {
    const result = await checkUrlSafety(url);
    assert.equal(result.ok, true);
    assert.ok(result.hostname);
    assert.ok(result.normalizedUrl);
  }
});
