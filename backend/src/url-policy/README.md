# KAN-110 / FR-URL-04 BE — URL policy

Chặn rút gọn URL trỏ về ToolHub hoặc dịch vụ rút gọn khác, kể cả khi xuất hiện trong chuỗi HTTP redirect. Module không ghi dữ liệu, không thêm dependency, không thay đổi entity User hoặc các module account/2FA/password-reset.

## Chạy thử

Từ `backend/`: `npm ci`, sao chép `.env.example` thành `.env`, điền `TOOLHUB_DOMAINS`, sau đó `npm run start:dev`.

`TOOLHUB_DOMAINS` là danh sách hostname phân cách bằng dấu phẩy, gồm domain web, domain link ngắn và mọi alias do nhóm sở hữu. Ví dụ minh họa: `toolhub.example,go.toolhub.example`. Không dùng domain minh họa ở production. Production từ chối khởi động khi biến này trống; cấu hình phải có đầy đủ domain thực tế. Hostname của `FRONTEND_URL` luôn được bổ sung. `URL_POLICY_EXTRA_SHORTENER_DOMAINS` chỉ bổ sung, không thay thế danh sách mặc định.

## API

`POST /api/v1/url-policy/check`, JSON chỉ có trường `url`:

```json
{ "url": "https://example.com/article" }
```

Thành công HTTP 200:

```json
{
  "allowed": true,
  "normalizedUrl": "https://example.com/article",
  "hostname": "example.com",
  "finalHostname": "example.com",
  "redirectsChecked": 0,
  "policyVersion": "2026-10-29.1"
}
```

Chỉ trả thành công sau khi đích cuối trả HTTP 2xx. `allowed` chỉ phản ánh chính sách tên miền và kết quả kiểm tra HTTP tại thời điểm đó; không phải chứng nhận không có malware. Không cache kết quả. Không trả lại chuỗi redirect, không ghi log URL, query, IP hay nội dung đích.

Lỗi có dạng `{"error":{"code":"...","reason":"..."}}`; `reason` chỉ xuất hiện cho đích chuyển hướng bị chặn.

| HTTP | code                               | Ý nghĩa                                                                    |
| ---- | ---------------------------------- | -------------------------------------------------------------------------- |
| 400  | INVALID_URL                        | Sai body/URL, quá 2048 ký tự, scheme khác HTTP(S), credentials/ký tự cấm   |
| 422  | SELF_DOMAIN_NOT_ALLOWED            | Domain ToolHub hoặc subdomain                                              |
| 422  | SHORTENER_DOMAIN_NOT_ALLOWED       | Domain dịch vụ rút gọn hoặc subdomain                                      |
| 422  | REDIRECT_TARGET_NOT_ALLOWED        | Redirect tới domain/IP/scheme không được phép; xem `reason`                |
| 422  | UNSAFE_URL_TARGET                  | IP không công khai, port tùy ý hoặc hostname nội bộ                        |
| 422  | REDIRECT_LOOP / TOO_MANY_REDIRECTS | Vòng lặp hoặc quá 5 redirect                                               |
| 503  | URL_VERIFICATION_FAILED            | DNS/TLS/network/timeout, redirect thiếu Location, HTTP cuối không phải 2xx |
| 429  | RATE_LIMITED                       | Quá 20 lần/phút/IP hoặc 16 lượt kiểm tra đồng thời; Retry-After: 60        |

## Tích hợp với tính năng tạo link

Trên develop tại fb8b921 chưa có API tạo/sửa link, repository link hoặc xử lý CSV. Module cung cấp API kiểm tra thật và export `UrlPolicyService`; không tự tạo tính năng lưu link ngoài KAN-110.

Module quản lý link cần import `UrlPolicyModule`, inject `UrlPolicyService` và gọi `await policy.assertCanShorten(input.url)` ngay trước khi lưu URL đích. Phải áp dụng cho tạo link khách/thành viên, sửa URL đích và từng dòng CSV. Chỉ lưu URL do lần gọi hiện tại chấp thuận; không nhận cờ `allowed` từ client, không tái sử dụng kết quả API kiểm tra trước đó như quyền bỏ qua kiểm tra. Lỗi phải dừng thao tác lưu; CSV báo lỗi theo dòng theo hợp đồng import của nhóm.

FE KAN-38 trên nhánh feature/FR-URL-04-FE-url-policy đã nối API này. Client chỉ kiểm tra cú pháp, mọi kết quả domain/redirect do BE quyết định; không cần giữ hai danh sách chặn cho luồng thực tế. FE xử lý lỗi mạng/503/429/phản hồi sai và hủy yêu cầu khi đổi input. Hai nhánh vẫn tách riêng; triển khai BE trước FE mới. Các endpoint ghi link chưa tồn tại nên chưa thể nghiệm thu việc chặn xuyên suốt tạo/sửa/import.

## Kiểm tra HTTP và SSRF

- Chỉ HTTP/HTTPS, 2048 ký tự, bỏ khoảng trắng ngoài; cấm credentials, ký tự điều khiển, khoảng trắng trong và backslash. Chuẩn hóa hostname bằng WHATWG URL (IDNA, chữ thường, dấu chấm cuối), so khớp đúng domain hoặc ranh giới `.domain`.
- Chỉ port mặc định 80/443 theo protocol. Không cho localhost, hostname một nhãn, `.local`, `.internal`, IPv4 private/link-local/CGNAT/multicast/reserved/documentation và IPv6 không công khai/tunnel/documentation/mapped IPv4.
- Phân giải toàn bộ địa chỉ DNS tại từng bước; từ chối nếu có bất kỳ địa chỉ không công khai. Ghim địa chỉ đã kiểm tra trong HTTP lookup, giữ nguyên Host/TLS hostname và xác minh chứng chỉ mặc định. Không phân giải DNS lần thứ hai khi mở kết nối.
- GET có Range: bytes=0-0, không đọc body, hủy kết nối sau response headers, giới hạn headers 16 KiB. Không gửi cookie/Authorization, không tự theo redirect. Chỉ xử lý 301/302/303/307/308, hỗ trợ Location tương đối. Kiểm tra domain, DNS/IP từng đích, tối đa 5 redirect, giới hạn tổng thời gian 5 giây gồm DNS và HTTP; hủy khi client ngắt kết nối.
- Bộ giới hạn RAM có tối đa 10000 bucket và không lưu IP thô. Giới hạn áp dụng từng process; triển khai nhiều instance cần rate limiter dùng chung. Proxy phải cấu hình trust proxy ở ứng dụng theo proxy thực tế; module không tin X-Forwarded-For.
- Đích có thể đổi sau kiểm tra; custom domain, trang dùng JS/meta refresh hoặc cloaking không thể nhận diện đầy đủ bằng danh sách và HTTP redirect. Không chạy trình duyệt/JS từ URL người dùng. Không tự coi mọi redirect bình thường (HTTP → HTTPS, đổi canonical URL) là vi phạm.

## Danh sách và nguồn

Policy version `2026-10-29.1`; nguồn đọc ngày 29/10/2026. Đây là danh sách chống rút gọn lồng nhau, không phải blacklist malware. Cần review định kỳ và bổ sung domain mới qua cấu hình.

| Domain      | Nguồn chính thức                                                                       |
| ----------- | -------------------------------------------------------------------------------------- |
| bit.ly      | https://dev.bitly.com/docs/tutorials/shorten-customize-links/                          |
| tinyurl.com | https://tinyurl.com/blog/how-create-tinyurl-link/                                      |
| cutt.ly     | https://cutt.ly/                                                                       |
| rebrand.ly  | https://developers.rebrandly.com/docs/get-started                                      |
| rb.gy       | https://support.rebrandly.com/en/articles/469545-isn-t-rebrandly-a-free-link-shortener |
| t.co        | https://help.x.com/en/using-x/url-shortener                                            |
| buff.ly     | https://support.buffer.com/articles/shortening-and-unshortening-links-dgev2p41yY       |
| ow.ly       | https://help.hootsuite.com/s/article/shorten-track-links                               |
| is.gd, v.gd | https://www.is.gd/developers.php                                                       |
| tiny.cc     | https://tiny.cc/                                                                       |
| t.ly        | https://t.ly/                                                                          |
| shorturl.at | https://www.shorturl.at/                                                               |
| s.gy        | https://blog.short.io/meet-sgy/                                                        |
| dub.sh      | https://dub.co/changelog/dub-links-updates                                             |
| d.to        | https://dub.co/blog/new-links-dashboard                                                |

Tham khảo chính sách chống chuỗi: https://www.v.gd/terms.php và https://cutt.ly/terms (mục 10). Tham khảo SSRF: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html .

FR-URL-03 (dịch vụ kiểm tra URL độc hại), BR-URL-01 (hết hạn link khách), BR-URL-02 (link trùng), BR-URL-03 (thống kê/IP) thuộc phần khác; module này không tự triển khai hoặc thay thế các phần đó.

## Kiểm chứng ngày 29/10/2026

- `npm test -- --runInBand`: 160/160 bài đạt, gồm các suite account/2FA sẵn có. Bài HTTP dùng Supertest và transport giả lập; không gọi domain ngẫu nhiên, gửi email hoặc ghi database.
- Độ phủ module URL policy: 97,04% statements, 91,25% branches, 99,06% lines.
- `npx tsc --noEmit`, `npx eslint "{src,apps,libs,test}/**/*.ts"` và `npm run build`: đạt. Không chạy lint auto-fix trên code thành viên khác.
- Smoke test bản build với transport thật: HTTPS tới `https://example.com/` được chấp thuận; Bitly, ToolHub thử nghiệm và IP loopback bị từ chối. Kiểm thử redirect/DNS rebinding dùng mock có kiểm soát để không truy cập tài nguyên nội bộ.
- Module chưa được gắn vào endpoint ghi link vì endpoint đó chưa có trên develop. Đây là phần phụ thuộc tích hợp cần nghiệm thu khi nhóm bổ sung tính năng tạo/sửa/import, không được coi API kiểm tra độc lập là bằng chứng đã bảo vệ các thao tác ghi chưa tồn tại.
