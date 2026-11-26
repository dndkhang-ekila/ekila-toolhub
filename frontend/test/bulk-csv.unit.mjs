import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(frontendRoot, 'src');
const require = createRequire(import.meta.url);
const ts = require(path.join(frontendRoot, 'node_modules', 'typescript'));

function loadTsModule(relPathFromSrc, moduleCache = new Map()) {
  const fullPath = path.join(srcRoot, relPathFromSrc);
  if (moduleCache.has(fullPath)) {
    return moduleCache.get(fullPath).exports;
  }

  const source = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    fileName: fullPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });

  const mod = { exports: {} };
  moduleCache.set(fullPath, mod);

  const localRequire = (specifier) => {
    let targetPath;
    if (specifier.startsWith('@/')) {
      targetPath = path.join(srcRoot, specifier.slice(2));
    } else if (specifier.startsWith('.')) {
      targetPath = path.resolve(path.dirname(fullPath), specifier);
    } else {
      return require(specifier);
    }

    const candidates = [
      targetPath,
      `${targetPath}.ts`,
      `${targetPath}.tsx`,
      path.join(targetPath, 'index.ts'),
    ];
    const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved) {
      throw new Error(`Cannot resolve "${specifier}" from "${fullPath}"`);
    }
    return loadTsModule(path.relative(srcRoot, resolved), moduleCache);
  };

  const fn = vm.runInThisContext(
    `(function(exports, require, module, __filename, __dirname) {\n${transpiled.outputText}\n})`,
    { filename: fullPath },
  );
  fn(mod.exports, localRequire, mod, fullPath, path.dirname(fullPath));
  return mod.exports;
}

const storageMap = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
  setItem: (key, value) => storageMap.set(key, String(value)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

const parser = loadTsModule('lib/bulk-csv-parser.ts');
const service = loadTsModule('lib/bulk-csv-service.ts');

test('[FR-URL-12] parseCsvMatrix: hỗ trợ UTF-8 BOM, dấu ngoặc kép và dấu phẩy trong ô', () => {
  const raw = '\uFEFF"original_url","custom_slug"\r\n"https://toolhub.vn/a?q=1,2","slug""1"\r\nhttps://docs.vn,docs-1';
  const matrix = parser.parseCsvMatrix(raw);
  assert.equal(matrix.length, 3);
  assert.deepEqual(matrix[0], ['original_url', 'custom_slug']);
  assert.deepEqual(matrix[1], ['https://toolhub.vn/a?q=1,2', 'slug"1']);
  assert.deepEqual(matrix[2], ['https://docs.vn', 'docs-1']);
});

test('[FR-URL-12] parseBulkCsvContent: gắn UTM, bắt lỗi URL, slug sai và slug trùng trong tệp', () => {
  const csv = [
    'original_url,custom_slug,utm_source,utm_medium,utm_campaign',
    'https://toolhub.vn/landing,launch-26,facebook,cpc,spring',
    'ftp://bad-protocol.test/file,bad-proto,,,',
    'https://user:pass@secret.test/doc,cred-err,,,',
    'https://toolhub.vn/short,ab,,,',
    'https://toolhub.vn/dup,launch-26,,,',
  ].join('\n');

  const { rows } = parser.parseBulkCsvContent(csv);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].validationError, undefined);
  assert.match(rows[0].originalUrl, /utm_source=facebook/);
  assert.match(rows[0].originalUrl, /utm_medium=cpc/);
  assert.match(rows[0].originalUrl, /utm_campaign=spring/);

  assert.match(rows[1].validationError, /http:\/\/ hoặc https:\/\//);
  assert.match(rows[2].validationError, /thông tin đăng nhập/);
  assert.match(rows[3].validationError, /3 đến 32 ký tự/);
  assert.match(rows[4].validationError, /Trùng slug/);
});

test('[FR-URL-12] parseBulkCsvContent: tự đọc tệp CSV không có tiêu đề kèm cảnh báo', () => {
  const csv = 'https://toolhub.vn/page-1,pg-1\nhttps://toolhub.vn/page-2,';
  const { rows, warnings } = parser.parseBulkCsvContent(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].customSlug, 'pg-1');
  assert.equal(rows[1].customSlug, '');
  assert.equal(warnings.length, 1);
});

test('[FR-URL-12] sanitizeCsvCell & serializeCsv: chống CSV Formula Injection và có UTF-8 BOM', () => {
  assert.equal(parser.sanitizeCsvCell('=CMD("calc")'), '"\'=CMD(""calc"")"');
  assert.equal(parser.sanitizeCsvCell('+SUM(A1:A2)'), "'+SUM(A1:A2)");
  const output = parser.serializeCsv(['col1', 'col2'], [['Tiếng Việt', 'a,b']]);
  assert.equal(output.startsWith('\uFEFFcol1,col2\r\nTiếng Việt,"a,b"'), true);
});

test('[FR-URL-12][BR-URL-01/03] buildLinksExportCsv: xuất đúng cột thống kê & trạng thái hết hạn', () => {
  const csv = parser.buildLinksExportCsv(
    [
      {
        id: 'lnk_1',
        slug: 'ekila-docs',
        shortUrl: 'https://toolhub.vn/s/ekila-docs',
        originalUrl: 'https://docs.ekila.vn',
        clickCount: 142,
        uniqueDailyClicks: 38,
        isActive: true,
        isGuest: false,
        status: 'active',
        createdAt: '2026-11-01T00:00:00.000Z',
        expiresAt: '2026-12-01T00:00:00.000Z',
        source: 'backend',
      },
      {
        id: 'lnk_2',
        slug: 'guest-old',
        shortUrl: 'https://toolhub.vn/s/guest-old',
        originalUrl: 'https://old.example.org',
        clickCount: 0,
        uniqueDailyClicks: 0,
        isActive: true,
        isGuest: true,
        status: 'expired',
        createdAt: '2026-10-01T00:00:00.000Z',
        expiresAt: '2026-10-31T00:00:00.000Z',
        source: 'backend',
      },
    ],
    'stats',
  );

  assert.match(csv, /click_count,unique_daily_clicks,status,owner_type/);
  assert.match(csv, /ekila-docs,.*142,38,Đang hoạt động,Thành viên/);
  assert.match(csv, /guest-old,.*0,0,Đã hết hạn,Khách \(30 ngày\)/);
});

test('[FR-URL-12][BR-URL-02] processBulkCsvRow: xử lý tái sử dụng link trùng, không gửi user giả và báo lỗi khi mất kết nối BE', async () => {
  storageMap.clear();
  const originalFetch = globalThis.fetch;
  let capturedHeaders = {};

  try {
    globalThis.fetch = async (_url, init) => {
      capturedHeaders = init?.headers || {};
      return new Response(
        JSON.stringify({
          link: {
            id: 'lnk_dup',
            slug: 'existing-slug',
            originalUrl: 'https://toolhub.vn/same',
            clickCount: 5,
            createdAt: '2026-11-20T00:00:00.000Z',
          },
          isDuplicate: true,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const reusedResult = await service.processBulkCsvRow(
      { rowNumber: 1, originalUrl: 'https://toolhub.vn/same', customSlug: '' },
      'reuse',
      'https://toolhub.vn',
    );
    assert.equal(reusedResult.status, 'reused');
    assert.equal(reusedResult.shortUrl, 'https://toolhub.vn/s/existing-slug');
    assert.equal(capturedHeaders['x-user-id'], undefined);

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ message: 'Domain rút gọn khác không được phép' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );

    const rejectedResult = await service.processBulkCsvRow(
      { rowNumber: 2, originalUrl: 'https://bit.ly/abc', customSlug: '' },
      'forceNew',
      'https://toolhub.vn',
    );
    assert.equal(rejectedResult.status, 'error');
    assert.equal(rejectedResult.message, 'Domain rút gọn khác không được phép');

    globalThis.fetch = async () => {
      throw new Error('Failed to fetch');
    };

    const offlineResult = await service.processBulkCsvRow(
      { rowNumber: 3, originalUrl: 'https://toolhub.vn/offline', customSlug: '' },
      'reuse',
      'https://toolhub.vn',
    );
    assert.equal(offlineResult.status, 'error');
    assert.equal(offlineResult.shortUrl, '');
    assert.match(offlineResult.message, /Không thể kết nối/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('[FR-URL-12][BR-URL-01/03] loadNormalizedLinksForExport: chuẩn hóa clickCount, uniqueDailyHashes và hợp nhất local', async () => {
  storageMap.clear();
  storageMap.set('toolhub_access_token', 'real_session_token');
  storageMap.set('toolhub_user', JSON.stringify({ id: 'usr_real_99' }));
  storageMap.set(
    'toolhub_shortened_links',
    JSON.stringify([
      {
        id: 'local_1',
        slug: 'local-only',
        originalUrl: 'https://local.toolhub.vn',
        shortUrl: 'https://toolhub.vn/s/local-only',
        createdAt: '2026-11-25T00:00:00.000Z',
        clicks: 3,
      },
    ]),
  );

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify([
          {
            id: 'lnk_be',
            slug: 'be-slug',
            originalUrl: 'https://docs.toolhub.vn',
            isActive: false,
            isGuest: false,
            clickCount: 19,
            uniqueDailyHashes: ['h1', 'h2', 'h3'],
            createdAt: '2026-11-24T00:00:00.000Z',
            expiresAt: '2026-12-24T00:00:00.000Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const { links, backendAvailable } = await service.loadNormalizedLinksForExport('https://toolhub.vn');
    assert.equal(backendAvailable, true);
    assert.equal(links.length, 2);

    const beLink = links.find((item) => item.slug === 'be-slug');
    assert.equal(beLink.clickCount, 19);
    assert.equal(beLink.uniqueDailyClicks, 3);
    assert.equal(beLink.status, 'disabled');

    const localLink = links.find((item) => item.slug === 'local-only');
    assert.equal(localLink.source, 'local');
    assert.equal(localLink.clickCount, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
