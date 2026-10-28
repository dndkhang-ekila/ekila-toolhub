# KAN-38 / FR-URL-04 FE

Giao diện riêng tại `/url-check`, chỉ có chức năng nhập URL và đối chiếu tên miền trước khi rút gọn. Không thêm tính năng tạo link, QR, lịch sử, database hoặc backend.

## Đã triển khai

- Giao diện trắng–xanh, trạng thái chưa nhập, input sai, link ToolHub, link dịch vụ rút gọn và chưa phát hiện tên miền bị chặn.
- Kiểm tra http/https, tối đa 2.048 ký tự, chặn thông tin đăng nhập/ký tự điều khiển trong URL.
- Phân tích hostname bằng URL API; đối chiếu tên miền chính và subdomain theo ranh giới dấu chấm. Không tìm chuỗi trong toàn bộ URL nên tránh chặn nhầm query hoặc tên miền như bit.ly.example.com.
- Chuẩn hóa chữ hoa/thường và dấu chấm cuối hostname trước khi so sánh.
- Xóa/nhập lại có quản lý focus; input liên kết với hướng dẫn/lỗi, kết quả có role alert/status. Giao diện dùng được bằng bàn phím và trên mobile.

## Cấu hình tên miền

`NEXT_PUBLIC_TOOLHUB_DOMAINS` là danh sách domain ToolHub, phân tách dấu phẩy, ví dụ `toolhub.example,links.toolhub.example`. Đây là ví dụ, không phải domain production đã xác nhận. Hostname đang phục vụ giao diện cũng được kiểm tra, không phụ thuộc cổng.

Danh sách dịch vụ rút gọn mặc định ở `lib/check-url-policy.ts` là dữ liệu ban đầu cho FE, chưa phải danh sách được nhóm/backend phê duyệt. Cần đồng bộ với KAN-110 trước tích hợp chính thức.

Thay biến NEXT_PUBLIC_* cần khởi động lại frontend; production phải build lại. Không thêm thư viện mới.

## Giới hạn và tích hợp

Đây là kiểm tra tên miền phía client, không xác nhận link an toàn, không truy cập URL đích, không theo redirect và không tạo link ngắn. Vì kiểm tra đồng bộ nên không tạo spinner hoặc độ trễ giả.

KAN-110 phải kiểm tra lại ở máy chủ, dùng danh sách domain thống nhất và áp dụng cho mọi đường tạo/cập nhật link. Không được tin kết quả FE để bỏ qua kiểm tra backend. Chưa gọi API KAN-110 vì nhóm chưa chốt endpoint/hợp đồng; kết quả chỉ ghi “Chưa phát hiện tên miền bị chặn”. Lỗi mạng/thử lại sẽ bổ sung khi tích hợp API thực tế.

## Kiểm tra

`node --test test/url-policy.unit.mjs` kiểm tra các trường hợp chuẩn hóa và nhầm lẫn hostname. `node --test test/url-policy.e2e.mjs` kiểm tra UI khi frontend đang chạy; TEST_BASE_URL mặc định http://localhost:3104. Bộ kiểm tra trình duyệt dùng PLAYWRIGHT_MODULE và PLAYWRIGHT_EXECUTABLE_PATH trỏ tới Playwright/Chromium có sẵn bên ngoài dự án, không sửa dependencies.

Chạy `npm run lint`, `npx tsc --noEmit` và `npm run build` để kiểm tra frontend. Lockfile develop hiện không chạy được npm ci với npm 11; môi trường riêng có thể dùng npm install --ignore-scripts --package-lock=false, không sửa lockfile trong task này.

Kiểm tra local ngày 28/10/2026: 5/5 unit test, 7/7 kiểm thử trình duyệt, ESLint, TypeScript và build production đạt. Form trạng thái bị chặn vừa desktop 1366×768 và 1280×720 không cần cuộn; mobile 360 px không tràn ngang, cho phép cuộn dọc để giữ chữ và nút dễ sử dụng.
