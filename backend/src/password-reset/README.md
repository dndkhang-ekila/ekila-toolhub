# FR-ACC-03 BE — Quên và đặt lại mật khẩu

## Phạm vi và tích hợp

- Ba API tương thích FE FR-ACC-03 hiện có, cùng prefix `/api/v1/auth`.
- SQLite local dùng chung bảng `users`; TypeORM và `better-sqlite3` theo nhánh FR-ACC-01 BE.
- `backend/src/auth/entities/user.entity.ts` được lấy nguyên byte từ nhánh FR-ACC-01 BE tại `7a46d3ba6c184633ee6a1ce458b0c1c83f9ed505`. Không thêm hoặc sửa thuộc tính nào của User.
- Entity mới: `PasswordResetToken` và `PasswordResetMailJob`. Entity mail job là outbox để yêu cầu gửi không bị mất khi backend dừng và không làm phản hồi API phụ thuộc việc email có tồn tại.
- Migration tạo bảng còn thiếu từ metadata, không bật synchronize, không ALTER bảng users sẵn có. Nếu users thiếu cột mà entity yêu cầu thì dừng để nhóm xử lý schema, không tự sửa.
- Chưa nhập toàn bộ AuthModule hoặc trang đăng nhập của nhánh FR-ACC-01. Module account và 2FA của nhóm giữ nguyên, vẫn có dữ liệu Map riêng; reset không tự chuyển đổi các module đó.

## Chạy local

Từ thư mục `backend`, cài dependencies rồi cấu hình `.env` theo `.env.example`:

```sh
npm install
npm run db:init
npm run db:seed:local
npm run start:dev
```

- Database mặc định: `backend/data/toolhub.sqlite` khi chạy từ backend.
- Seed chỉ chạy cho phát triển, tạo `dat.local@example.test`, mật khẩu ngẫu nhiên trong `backend/data/local-test-account.json`. Không đổi mật khẩu nếu tài khoản đã có.
- Có thể seed email thử khác bằng `npm run db:seed:local -- your-email@example.com`; thông tin được ghi vào `backend/data/local-gmail-test-account.json`. Đây chỉ là User local đã xác minh để thử chức năng, không đăng ký tài khoản ra hệ thống bên ngoài.
- `.env`, toàn bộ `backend/data/`, database, mật khẩu thử và email đều bị Git bỏ qua. Không đưa file SQLite, key hoặc email thử vào commit.
- `db:init` là bước migration có chủ đích; app không tự chạy migration hoặc synchronize. Không dùng migration rollback tự động để xóa bảng users.

### Hộp thư cục bộ

Đặt `PASSWORD_RESET_MAIL_MODE=local`, chạy `npm run mail:local`, mở `http://127.0.0.1:8025`. Gửi yêu cầu từ `/forgot-password` với email đã seed, rồi tải lại hộp thư và mở link reset.

Hộp thư này chỉ bind loopback, chỉ dùng phát triển. Email local chứa link thật để thử, được lưu trong `backend/data/mailbox`; không gửi đến Gmail và không có endpoint hộp thư trên API public. Xóa email thử khi không còn cần.

### SMTP thật

Đặt `PASSWORD_RESET_MAIL_MODE=smtp` và cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD` trong `.env` riêng. Gmail dùng smtp.gmail.com, TLS trực tiếp cổng 465 với SMTP_SECURE=true và mật khẩu ứng dụng. Không ghi thông tin xác thực vào tài liệu hoặc `.env.example`.

Sau khi thay `.env`, khởi động lại backend để đọc cấu hình mới. Một phản hồi 202 chỉ xác nhận yêu cầu đã vào outbox; worker phải gửi được và provider chấp nhận mới ghi trạng thái sent. Điều này không chứng minh thư đã vào Inbox thay vì Spam.

Ở production: cần FRONTEND_URL dùng HTTPS, SMTP cấu hình đầy đủ và PASSWORD_RESET_MAIL_KEY là 32 byte dạng hex (64 ký tự) được cung cấp từ kho bí mật. Chế độ local bị chặn. Không thay key khi còn job chưa xử lý nếu chưa có kế hoạch chuyển đổi.

Tài liệu tham chiếu: [Google SMTP](https://developers.google.com/workspace/gmail/imap/imap-smtp), [Nodemailer SMTP](https://nodemailer.com/smtp), [TypeORM SQLite](https://typeorm.io/docs/drivers/sqlite/).

## Hợp đồng API

| API | Request | Thành công |
|---|---|---|
| POST /api/v1/auth/forgot-password | `{ "email": "..." }` | 202, thông báo tiếp nhận chung; Retry-After: 60 |
| POST /api/v1/auth/reset-password/validate | `{ "token": "..." }` | 200 `{ "valid": true }` |
| POST /api/v1/auth/reset-password | `{ "token": "...", "newPassword": "..." }` | 204 không body |

Lỗi: `{ "error": { "code": "..." } }`:

- 400 INVALID_EMAIL hoặc RESET_LINK_INVALID; đầu vào có trường ngoài hợp đồng trả INVALID_REQUEST.
- 422 PASSWORD_POLICY_VIOLATION.
- 429 RATE_LIMITED kèm Retry-After.
- 503 SERVICE_UNAVAILABLE cho lỗi hạ tầng.

Không trả token hoặc chi tiết provider/database qua API. Response không cache; Retry-After được expose cho CORS mà không sửa cấu hình CORS chung của nhóm.

## Quy tắc nghiệp vụ đã triển khai

- Email chuẩn hóa trim/lowercase. Yêu cầu hợp lệ luôn được ghi outbox và trả 202 chung, dù tài khoản tồn tại, chưa xác minh hoặc chỉ dùng Google. Chỉ User đã xác minh và có passwordHash được phát hành token.
- Token ngẫu nhiên 32 byte, base64url; bảng token chỉ lưu SHA-256. Token hết hạn đúng 30 phút sau khi worker tạo. Validate không tiêu thụ token.
- Job lưu email/token bằng AES-256-GCM. Phát triển tự tạo key trong file local bị ignore; production phải cung cấp key riêng. Payload được xóa sau khi gửi, bỏ qua hoặc hết số lần retry.
- Worker claim job bằng lease 120 giây, xử lý tuần tự từng tiến trình, tối đa 5 lần gửi. Retry không tạo lại token hoặc kéo dài thời hạn. SMTP trả lỗi không lộ thông tin tài khoản qua API và không log token/mật khẩu.
- Yêu cầu mới được xử lý sẽ hủy token cũ đang hoạt động. Link trong email retry sau có thể đã bị yêu cầu mới vô hiệu; không gửi lại token đã hết hạn/đã dùng/bị hủy.
- Reset kiểm tra lại token sau khi bcrypt chạy. Claim token, cập nhật passwordHash, tăng tokenVersion và hủy token còn lại trong cùng transaction. Nếu cập nhật User lỗi thì rollback cả việc tiêu thụ token.
- Mật khẩu mới: ít nhất 8 ký tự, có hoa/thường/số/ký tự đặc biệt; không quá 72 byte UTF-8 để tránh bcrypt cắt ngầm. Dùng bcrypt cost 10 tương thích đăng nhập. Chính sách này chặt hơn giới hạn 128 ký tự của DTO đăng ký hiện tại; cần nhóm thống nhất lại trước release, không tự sửa DTO của thành viên.
- Tăng tokenVersion phục vụ guard JWT FR-ACC-01. Không tự đăng nhập, không đổi isEmailVerified hoặc cấu hình 2FA. Các phiên demo/Map của account/2FA chưa dùng chung User thì chưa được đồng bộ bởi thao tác này.
- Dọn job đã kết thúc và token hết hạn sau khoảng lưu thêm 24 giờ, kiểm tra mỗi giờ khi worker chạy. Không dọn dữ liệu User.

## Giới hạn tần suất và vận hành

- Gửi lại: ít nhất 60 giây/email; tối đa 5 yêu cầu/email/giờ, 20 yêu cầu/IP/giờ.
- Validate/reset: 30 yêu cầu/IP/phút và 10 yêu cầu/token/phút, áp dụng riêng từng endpoint.
- Không tin X-Forwarded-For mặc định. Khi đặt sau proxy phải cấu hình trust proxy theo đúng hạ tầng, không bật tin mọi proxy.
- Bộ đếm hiện nằm trong RAM, phù hợp một tiến trình local. Trước production nhiều instance cần limiter dùng chung và cơ chế chống bot/CAPTCHA theo chính sách nhóm; reset backend này chưa tự triển khai Redis hoặc CAPTCHA.
- SQLite ghi được serialize theo DataSource; claim có điều kiện và transaction bảo vệ token, có retry giới hạn khi SQLite busy/locked. Cần kiểm thử hạ tầng riêng trước khi chạy nhiều instance.
- Khi FR-ACC-01 BE được merge, dùng một DataSource duy nhất. Gộp cấu hình vào DatabaseModule và giữ cả ba entity; không giữ hai TypeOrmModule.forRoot cùng lúc. Không cần sửa User entity để thêm quan hệ ngược.
- Chặn log body/token/URL reset tại proxy/APM. SMTP worker chỉ log thông báo lỗi chung, không log lỗi gốc có thể chứa nội dung thư.

## Kiểm thử

```sh
npm test -- --runInBand
npx eslint src/password-reset src/database src/app.module.ts
npm run build
npm test -- --runInBand --coverage --collectCoverageFrom="password-reset/**/*.ts" --collectCoverageFrom="database/**/*.ts"
```

Kiểm thử tích hợp dùng SQLite file tạm, HTTP local và hộp thư tạm; không dùng Gmail hoặc database local đang làm việc. Bao gồm token đúng 30 phút, dùng một lần, cạnh tranh hai request, rollback khi ghi User lỗi, giữ schema users, mã hóa outbox, retry/recovery lease, policy, rate limit và lưu bền khi mở lại database.

Không chạy thử email thật trong test tự động. Chỉ cấu hình SMTP và gửi email kiểm thử riêng khi chủ tài khoản cho phép. Việc đăng nhập thực tế bằng JWT/Google vẫn cần FR-ACC-01 được tích hợp và kiểm thử chung.

### Kết quả kiểm tra local ngày 28/10/2026

- Toàn bộ 52 bài backend đạt, gồm các bài account/2FA có sẵn của nhóm.
- ESLint toàn backend, TypeScript và build đạt. Độ phủ phần database/password-reset: 92,47% statements, 78,57% branches, 94,03% lines.
- Trình duyệt thật đã chạy luồng FE → backend thật → email local → reset; xác nhận bcrypt passwordHash, tokenVersion và usedAt trong SQLite, token được xóa khỏi URL sau thành công. Kiểm tra này dùng database tách biệt, không gửi Gmail.
- Gmail SMTP đã xác thực và chấp nhận một email reset được yêu cầu qua API local, gửi về chính hộp thư dự án do người dùng cung cấp. Không khẳng định email đã vào Inbox.
- User entity được so sánh byte với bản gốc và không có khác biệt; không có diff trong account, 2FA hoặc frontend. Mật khẩu SMTP không xuất hiện trong file có thể đưa vào Git.
- Audit còn hai cảnh báo high từ Nest platform-express/Multer đã có sẵn: phiên bản trong lockfile trước và sau đều là 11.2.8/2.4.0. Không tự nâng các phần chung của nhóm trong task này; Nodemailer mới dùng bản 10.2.1 đã hết cảnh báo được phát hiện khi cài bản cũ.
