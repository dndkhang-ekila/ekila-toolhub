const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
if (fsSync.existsSync(path.join(root, '.env')))
  process.loadEnvFile(path.join(root, '.env'));
if (process.env.NODE_ENV === 'production')
  throw new Error('Local mailbox is disabled in production');
const directory =
  process.env.PASSWORD_RESET_MAIL_DIR || path.join(root, 'data/mailbox');
const port = Number(process.env.PASSWORD_RESET_MAILBOX_PORT || 8025);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ],
  );
const server = http.createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  );
  if (
    ![`localhost:${port}`, `127.0.0.1:${port}`].includes(
      request.headers.host,
    ) ||
    request.method !== 'GET' ||
    request.url !== '/'
  ) {
    response.writeHead(404).end();
    return;
  }
  try {
    await fs.mkdir(directory, { recursive: true });
    const files = (await fs.readdir(directory))
      .filter((name) => /^[a-f0-9-]{36}\.json$/.test(name))
      .sort()
      .slice(-100);
    const messages = await Promise.all(
      files.map(async (name) =>
        JSON.parse(await fs.readFile(path.join(directory, name), 'utf8')),
      ),
    );
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(
      `<!doctype html><html lang="vi"><meta charset="utf-8"><title>ToolHub — Hộp thư local</title><style>body{font:16px system-ui;background:#f3f7ff;color:#163055;max-width:900px;margin:40px auto;padding:20px}article{padding:24px;background:white;border:1px solid #dbe7ff;border-radius:16px;margin:20px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#245cf0}</style><h1>Hộp thư thử nghiệm ToolHub</h1><p>Email ở đây chỉ lưu trên máy này, không được gửi tới hộp thư thật. Tải lại trang để xem email mới.</p>${
        messages.length
          ? messages
              .map((mail) => {
                const url = new URL(mail.link);
                const link = ['http:', 'https:'].includes(url.protocol)
                  ? `<a href="${escape(url.href)}" rel="noreferrer">Mở trang đặt lại mật khẩu</a>`
                  : '';
                return `<article><h2>${escape(mail.subject)}</h2><p>Đến: ${escape(mail.to)}</p><pre>${escape(mail.text)}</pre>${link}</article>`;
              })
              .join('')
          : '<article>Chưa có email. Gửi yêu cầu từ trang Quên mật khẩu.</article>'
      }</html>`,
    );
  } catch {
    response.writeHead(503).end('Local mailbox unavailable');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Local mailbox: http://127.0.0.1:${port}`),
);
