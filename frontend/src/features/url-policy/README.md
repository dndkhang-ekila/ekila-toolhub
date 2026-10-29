# KAN-38 / FR-URL-04 FE — tích hợp KAN-110

Giao diện riêng tại /url-check gọi POST /api/v1/url-policy/check của KAN-110. Không tạo QR, link ngắn, database hoặc thay đổi entity.

## Luồng thực tế

Client kiểm tra cú pháp HTTP(S), độ dài 2048 ký tự và credentials/ký tự cấm; mọi URL qua bước cú pháp đều gửi đến backend, kể cả domain dịch vụ rút gọn đã biết. Máy chủ quyết định domain ToolHub, danh sách dịch vụ và kết quả kiểm tra redirect. Không dùng kết quả local để hiển thị thành công khi BE chưa trả lời.

Có trạng thái đang kiểm tra, chặn ToolHub/dịch vụ rút gọn/đích redirect/địa chỉ nội bộ, URL sai, giới hạn lượt gọi và chưa thể xác minh. Lỗi mạng, timeout, API chưa triển khai, phản hồi không đúng hợp đồng và HTTP 503 đều không trở thành kết quả cho phép. HTTP 429 hiển thị thời gian Retry-After. Nút gửi bị khóa khi đang kiểm tra; sửa/xóa URL hoặc rời trang hủy yêu cầu, không hiển thị kết quả cũ. Client timeout 10 giây; BE giới hạn 5 giây. Không gửi cookie hoặc referrer tới API, không ghi log URL, không điều hướng trình duyệt đến URL nhập vào.

Thành công chỉ có nghĩa máy chủ chưa phát hiện domain/HTTP redirect bị cấm tại thời điểm kiểm tra. Không chứng nhận nội dung an toàn và không cấp quyền bỏ qua kiểm tra khi tạo link.

## Cấu hình và chạy hai nhánh

FE: NEXT_PUBLIC_API_URL=http://127.0.0.1:4110/api/v1, chạy npm run dev -- --hostname 127.0.0.1 --port 3110.

BE trên nhánh feature/FR-URL-04-BE-url-policy: PORT=4110, FRONTEND_URL=http://127.0.0.1:3110, TOOLHUB_DOMAINS=localhost,127.0.0.1 rồi npm run build và npm run start:prod. NODE_ENV production yêu cầu TOOLHUB_DOMAINS có giá trị. Thêm toàn bộ domain triển khai thực tế, không dùng domain minh họa thay cho domain thật. Chỉ dùng localhost/cổng thử cho local.

Mở http://127.0.0.1:3110/url-check. Cần chạy cả hai nhánh riêng; không cần gộp BE vào nhánh FE. Khi đổi NEXT_PUBLIC_API_URL phải khởi động lại dev server hoặc build lại production. Production dùng URL API HTTPS và FRONTEND_URL đúng origin FE để CORS hoạt động.

NEXT_PUBLIC_TOOLHUB_DOMAINS không còn được form sử dụng để quyết định kết quả; TOOLHUB_DOMAINS ở BE là cấu hình quyết định. Hàm checkUrlPolicy ở lib vẫn có hỗ trợ so khớp domain cho unit test, nhưng form chỉ dùng phần kiểm tra cú pháp và không giữ danh sách chặn riêng cho luồng thực tế.

## Kiểm thử

node --test test/url-policy.unit.mjs test/url-policy.e2e.mjs

TEST_BASE_URL mặc định http://127.0.0.1:3110. Cần BE chạy thật 4110 và FE dùng API tương ứng. PLAYWRIGHT_MODULE và PLAYWRIGHT_EXECUTABLE_PATH có thể trỏ tới Playwright/Chromium có sẵn bên ngoài dự án, không thay dependency. Các ca URL thường, ToolHub và dịch vụ rút gọn chạy với BE thật. Các ca lỗi mạng/503/429/phản hồi sai/đổi input dùng intercept có kiểm soát; chúng không phải bằng chứng gọi website ngoài thật.

Chạy npm run lint, npx tsc --noEmit, npm run build. Không thay lockfile trong task này.

## Phụ thuộc nghiệm thu

FE và BE được review riêng vào develop; triển khai BE trước FE mới. API tạo/sửa/import link chưa có trên develop tại fb8b921. Nhóm quản lý link phải gọi UrlPolicyService.assertCanShorten ngay trước khi lưu từng URL; không tin cờ allowed do client gửi. Hai task này đã có luồng kiểm tra FE–BE, chưa thay thế phần tạo/lưu link của nhóm hoặc kiểm tra malware thuộc FR-URL-03.

## Kết quả ngày 29/10/2026

17/17 bài kiểm thử FE đạt (5 unit, 12 trình duyệt). Kiểm thử smoke trên trình duyệt với BE thật: example.com trả 200, Bitly và hostname ToolHub cấu hình local trả 422; kết quả thành công/bị chặn đều vừa viewport 1280x720, không tràn ngang. Bộ kiểm thử cũng kiểm tra mobile 360px và desktop 1366x768, 1280x720. ESLint, TypeScript và build production đạt. Các ca lỗi mạng/429/503/redirect trong bộ FE có dùng intercept như mô tả trên; backend có bộ kiểm thử redirect riêng. Không thay đổi database hoặc entity.
