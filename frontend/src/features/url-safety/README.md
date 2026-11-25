# FR-URL-03 / URL Safety & Malicious Verification

Module kiểm tra an toàn URL đích trước khi tạo liên kết rút gọn, đối chiếu với danh sách chặn nội bộ và dịch vụ kiểm tra URL độc hại. URL vi phạm bị từ chối kèm lý do rõ ràng.

## Phạm vi triển khai

- **Mã yêu cầu**: `[FR-URL-03][FE]` (Thuộc tiện ích M01 - Rút gọn link, mức ưu tiên P0 Must theo SRS TH-SRS-001).
- **Giao diện & Route**: Tích hợp trực tiếp vào tuyến `/tools/url-shortener` của hệ thống công cụ ToolHub, hỗ trợ giao diện responsive từ mobile (360px) đến desktop, dark/light mode.
- **Quy tắc nghiệp vụ**:
  - `BR-URL-01`: Liên kết tạo bởi Khách (Guest) không thể sửa/xoá; tự hết hạn sau 30 ngày nếu không có lượt nhấp.
  - `BR-URL-02`: Nếu rút gọn lại URL đích đã từng tạo trong phiên, hệ thống hỏi người dùng muốn dùng lại link cũ hay tạo link mới.
  - `BR-URL-03`: Thống kê không lưu IP thô; bảo vệ danh tính theo chuẩn an toàn thông tin cá nhân.
  - `FR-URL-04`: Chống loopback và chuỗi chuyển hướng: Không cho rút gọn link trỏ về chính tên miền ToolHub hoặc các dịch vụ rút gọn khác.

## Tiêu chí nghiệm thu (Given / When / Then)

1. **Given**: URL đích nằm trong danh sách chặn nội bộ (Phishing / Scam / Blacklist);
   **When**: Người dùng yêu cầu rút gọn link;
   **Then**: Hệ thống không tạo link và hiển thị lý do từ chối rõ ràng kèm mã phân loại `INTERNAL_BLOCKLIST`.

2. **Given**: URL đích bị dịch vụ an ninh cờ là chứa mã độc hại (Malware);
   **When**: Người dùng yêu cầu rút gọn link;
   **Then**: Hệ thống không tạo link và hiển thị lý do từ chối: Cảnh báo chứa mã độc hại hoặc tệp tin nguy hiểm kèm mã `MALICIOUS_MALWARE`.

3. **Given**: URL đích bị dịch vụ an ninh cờ là lừa đảo (Phishing / Social Engineering);
   **When**: Người dùng yêu cầu rút gọn link;
   **Then**: Hệ thống không tạo link và hiển thị lý do từ chối: Cảnh báo lừa đảo mạo danh kèm mã `MALICIOUS_PHISHING`.

4. **Given**: URL đích sử dụng địa chỉ IP trực tiếp (IPv4 / IPv6 trần);
   **When**: Người dùng yêu cầu rút gọn link;
   **Then**: Hệ thống không tạo link và hiển thị lý do từ chối: Cấm rút gọn IP trực tiếp để phòng chống SSRF và tấn công mạng nội bộ (`DIRECT_IP_DISALLOWED`).

5. **Given**: URL đích là tên miền hợp lệ và an toàn;
   **When**: Người dùng yêu cầu rút gọn link;
   **Then**: Hệ thống tiến hành tạo link ngắn, hiển thị mã QR, nút sao chép và thời hạn sử dụng 30 ngày.

## Hợp đồng tích hợp API đề xuất cho Backend (KAN-110 / Backend Shortener)

| Endpoint | Method | Body | Phản hồi thành công | Phản hồi vi phạm |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/links/check-safety` | POST | `{ "url": "string" }` | `200 OK` `{ "isSafe": true }` | `400 Bad Request` `{ "isSafe": false, "kind": "MALICIOUS_MALWARE", "reason": "..." }` |
| `/api/v1/links/shorten` | POST | `{ "originalUrl": "string", "customSlug": "string?" }` | `201 Created` `{ "shortUrl": "...", "slug": "..." }` | `422 Unprocessable` `{ "error": "URL_BLOCKED", "reason": "..." }` |

## Kiểm thử tự động (Unit Test)

Chạy bộ unit test từ thư mục gốc hoặc thư mục `frontend`:
```bash
node --test frontend/test/url-safety.unit.mjs
```
Bộ kiểm thử bao gồm 7 kịch bản kiểm tra toàn diện tất cả các tiêu chí nghiệm thu của SRS TH-SRS-001.
