import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRandomSlug,
  validateUrl,
  SAFE_ALPHANUMERIC_CHARSET,
} from '../src/lib/url-shortener.ts';

test('[FR-URL-01] validateUrl: hợp lệ với URL https và http', () => {
  const res1 = validateUrl('https://example.com/some/path?param=1');
  assert.equal(res1.isValid, true);
  assert.equal(res1.sanitizedUrl, 'https://example.com/some/path?param=1');

  const res2 = validateUrl('http://my-subdomain.toolhub.vn:8080/api');
  assert.equal(res2.isValid, true);
  assert.equal(res2.sanitizedUrl, 'http://my-subdomain.toolhub.vn:8080/api');
});

test('[FR-URL-01] validateUrl: từ chối URL rỗng', () => {
  const res = validateUrl('');
  assert.equal(res.isValid, false);
  assert.equal(res.error, 'errorEmpty');

  const resSpace = validateUrl('   ');
  assert.equal(resSpace.isValid, false);
  assert.equal(resSpace.error, 'errorEmpty');
});

test('[FR-URL-01] validateUrl: từ chối URL vượt quá 2.048 ký tự', () => {
  const longPath = 'a'.repeat(2050);
  const res = validateUrl(`https://example.com/${longPath}`);
  assert.equal(res.isValid, false);
  assert.equal(res.error, 'errorTooLong');
});

test('[FR-URL-01] validateUrl: từ chối protocol không phải http/https', () => {
  const resFtp = validateUrl('ftp://ftp.is.co.za/rfc/rfc1808.txt');
  assert.equal(resFtp.isValid, false);
  assert.equal(resFtp.error, 'errorInvalidProtocol');

  const resJs = validateUrl('javascript:alert(1)');
  assert.equal(resJs.isValid, false);
  assert.equal(resJs.error, 'errorInvalidProtocol');

  const resNoProto = validateUrl('example.com/test');
  assert.equal(resNoProto.isValid, false);
  assert.equal(resNoProto.error, 'errorInvalidProtocol');
});

test('[FR-URL-01] validateUrl: từ chối URL cấu trúc không hợp lệ', () => {
  const res1 = validateUrl('https://');
  assert.equal(res1.isValid, false);
  assert.equal(res1.error, 'errorInvalidUrl');

  const res2 = validateUrl('https://no-dot-domain');
  assert.equal(res2.isValid, false);
  assert.equal(res2.error, 'errorInvalidUrl');
});

test('[FR-URL-01] generateRandomSlug: sinh slug 6–8 ký tự và loại bỏ ký tự dễ nhầm (0/O, 1/l, I)', () => {
  const confusableChars = ['0', 'O', '1', 'l', 'I'];

  for (let i = 0; i < 200; i++) {
    const slug = generateRandomSlug(6, 8);
    assert.ok(slug.length >= 6 && slug.length <= 8, `Slug length ${slug.length} must be 6..8`);

    for (const char of slug) {
      assert.ok(
        SAFE_ALPHANUMERIC_CHARSET.includes(char),
        `Char ${char} must be in SAFE_ALPHANUMERIC_CHARSET`,
      );
      assert.ok(
        !confusableChars.includes(char),
        `Slug contains forbidden confusable char: ${char}`,
      );
    }
  }
});

test('[FR-URL-01] Tiêu chí nghiệm thu: sinh slug hoàn tất dưới 1 giây', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    generateRandomSlug(6, 8);
  }
  const duration = Date.now() - start;
  assert.ok(duration < 1000, `Duration ${duration}ms must be well under 1000ms`);
});
