# FR-ACC-03 — KAN-17

Giao diện trắng–xanh dương cho `/forgot-password` và `/reset-password?token=...`, hỗ trợ Việt/Anh và màn hình từ 360 px.

## Phạm vi đã triển khai

- Form yêu cầu email, kiểm tra đầu vào, trạng thái tiếp nhận và gửi lại.
- Kiểm tra token khi mở trang, form mật khẩu mới, xác nhận mật khẩu, hiện/ẩn, lỗi và thành công.
- Token thiếu, trùng tham số hoặc không hợp lệ không mở form. Lỗi kết nối cho phép thử lại.
- Kiểm soát gửi trùng, thông báo hỗ trợ trình đọc màn hình và không lưu dữ liệu nhạy cảm vào localStorage.
- `Referrer-Policy: no-referrer`, robots noindex và yêu cầu không lưu cache cho hai trang.

## Hợp đồng API đề xuất cần tích hợp với KAN-93

Base URL lấy từ `NEXT_PUBLIC_API_URL`.

| API                                | Body                                       | Phản hồi thành công                                                |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| POST /auth/forgot-password         | `{ "email": "..." }`                       | 202, thông báo tiếp nhận chung cho tài khoản tồn tại/không tồn tại |
| POST /auth/reset-password/validate | `{ "token": "..." }`                       | 200 với `{ "valid": true }`, không tiêu thụ token                  |
| POST /auth/reset-password          | `{ "token": "...", "newPassword": "..." }` | 204                                                                |

Lỗi đầu vào 400/422 dùng `{ "error": { "code": "..." } }`. Các mã được hỗ trợ: INVALID_EMAIL, RESET_LINK_INVALID, PASSWORD_POLICY_VIOLATION. Giới hạn tần suất trả 429; Retry-After có thể là số giây hoặc HTTP date. Với API khác origin, backend cần expose header Retry-After qua CORS. Sau 202 cũng có thể gửi Retry-After để điều khiển nút gửi lại. Không có thời gian 60 giây hardcode.

404, lỗi mạng hoặc phản hồi không đúng hợp đồng không được hiển thị thành công. Không có mock backend hoặc cơ chế bỏ qua token trong giao diện sản phẩm.

## Phụ thuộc backend và tài khoản

Backend local hiện chưa có API auth/KAN-93. Vì vậy có thể xem và sử dụng giao diện nhưng chưa gửi được email hoặc đổi mật khẩu thật. Các trạng thái thành công chỉ xuất hiện sau phản hồi API đúng hợp đồng.

`NEXT_PUBLIC_LOGIN_URL` mặc định `/login`, trỏ về trang đăng nhập FR-ACC-01 đã tích hợp. Liên kết “Quên mật khẩu?” trên trang đăng nhập dẫn đến `/forgot-password`. Link thương hiệu dẫn về trang chủ của dự án.

Hai trang khôi phục nằm trong nhóm route `src/app/(password-reset)` với layout riêng. Nhóm `src/app/(auth)` giữ layout đăng nhập/đăng ký của FR-ACC-01; việc tách nhóm không thay đổi URL.

Backend phải kiểm tra token dùng một lần, thời hạn 30 phút, trạng thái tài khoản và chính sách mật khẩu chung. FE chỉ kiểm tra email, trường bắt buộc và mật khẩu xác nhận; không tự đặt chính sách độ dài/độ phức tạp riêng khi nhóm chưa chốt.

## Kiểm thử giao diện

Chạy frontend trước, sau đó chạy `node --test test/password-reset.e2e.mjs` từ thư mục frontend. Bộ kiểm thử cần Playwright và Chromium có sẵn. Có thể trỏ `PLAYWRIGHT_MODULE` tới thư mục package Playwright bên ngoài dự án và `PLAYWRIGHT_EXECUTABLE_PATH` tới trình duyệt đã cài, không cần thay đổi dependencies của ứng dụng.

`TEST_BASE_URL` mặc định `http://localhost:3000`. `TEST_SCREENSHOT_DIR` là thư mục lưu ảnh tùy chọn. Bộ kiểm thử chặn các request API auth và trả phản hồi giả lập chỉ trong môi trường kiểm thử; không gửi email, không đổi mật khẩu thật. Kiểm tra tiếp nhận yêu cầu, lỗi API, giới hạn tần suất, token không hợp lệ/hết hạn, mật khẩu không khớp, thành công, ngôn ngữ và bố cục mobile. Việc vượt qua các bài này chưa chứng minh backend đáp ứng thời hạn 30 phút hoặc token dùng một lần.

Kiểm tra tích hợp ngày 28/10/2026: ESLint, TypeScript và build production đã đạt trong bản làm việc riêng sau khi tích hợp `main`. Bộ kiểm thử trình duyệt gồm 12 tình huống reset mật khẩu và một tình huống chuyển trang đăng nhập → quên mật khẩu → đăng nhập → đăng ký để kiểm tra hai layout độc lập.

Trước production, cấu hình loại token khỏi access log của proxy, ứng dụng, APM và mọi hệ thống giám sát. Không đặt analytics/tài nguyên bên thứ ba vào trang reset. Chặn cache ở CDN/service worker cho hai trang và API auth. Không dùng token thật khi chụp hình hoặc ghi kết quả kiểm thử.
