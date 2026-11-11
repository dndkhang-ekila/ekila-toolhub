import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Tạo giao diện HTML Email thương hiệu ToolHub chuyên nghiệp
   */
  private buildOtpEmailHtml(
    code: string,
    verifyLink: string,
    toEmail: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[ToolHub] Mã xác minh tài khoản</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e5e7eb;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center;">
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td style="background: rgba(255, 255, 255, 0.2); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; font-size: 22px; color: #ffffff;">
                    🛠️
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1;">ToolHub</div>
                    <div style="font-size: 13px; color: #e0e7ff; margin-top: 4px; font-weight: 400;">Nền tảng công cụ số & tiện ích trực tuyến</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 700; text-align: center;">
                Xác thực địa chỉ Email của bạn
              </h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6; text-align: center;">
                Xin chào <strong>${toEmail}</strong>,<br/>
                Cảm ơn bạn đã lựa chọn sử dụng ToolHub. Để kích hoạt tài khoản và tiếp tục trải nghiệm, vui lòng nhập mã OTP xác thực dưới đây:
              </p>

              <!-- OTP Highlight Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 14px; padding: 24px 16px;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">
                      MÃ XÁC THỰC (OTP)
                    </div>
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #4338ca; line-height: 1.2;">
                      ${code}
                    </div>
                    <div style="font-size: 13px; color: #dc2626; margin-top: 10px; font-weight: 500;">
                      ⏱️ Mã có hiệu lực trong <strong>30 phút</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${verifyLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                      Kích hoạt tài khoản trực tiếp
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin: 16px 0 24px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
                Nếu nút trên không phản hồi, bạn có thể sao chép liên kết này vào trình duyệt:<br/>
                <a href="${verifyLink}" target="_blank" style="color: #4f46e5; word-break: break-all; text-decoration: underline;">
                  ${verifyLink}
                </a>
              </p>

              <!-- Security Callout -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 8px; margin-top: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
                      <strong>⚠️ Cảnh báo bảo mật:</strong> Không chia sẻ mã OTP hoặc liên kết này cho bất kỳ ai, bao gồm cả ban quản trị ToolHub. Nếu bạn không thực hiện đăng ký tài khoản tại ToolHub, vui lòng bỏ qua thư này.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 500; color: #6b7280;">
                © 2026 ToolHub. Nền tảng công cụ trực tuyến an toàn và hiệu quả.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.4;">
                Hệ thống gửi tự động tuân thủ quy chuẩn bảo mật và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Gửi email chứa mã OTP và link xác minh theo chuẩn SRS Table 8 (Dịch vụ email giao dịch)
   * Sử dụng SMTP Transporter đọc từ biến môi trường.
   */
  async sendVerificationEmail(
    toEmail: string,
    code: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(
      toEmail,
    )}&token=${encodeURIComponent(token)}`;

    // In ra console log nổi bật để dễ dàng test & nghiệm thu ngay tại terminal
    this.logger.log('====================================================');
    this.logger.log(`📬 [DỊCH VỤ EMAIL GIAO DỊCH TOOLHUB]`);
    this.logger.log(`Gửi tới: ${toEmail}`);
    this.logger.log(
      `MÃ XÁC MINH OTP (6 chữ số): [ ${code} ] (Hết hạn sau 30 phút)`,
    );
    this.logger.log(`LINK XÁC MINH NHANH: ${verifyLink}`);
    this.logger.log('====================================================');

    // Đọc cấu hình SMTP từ biến môi trường (.env)
    const host =
      this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port =
      Number(this.configService.get<number | string>('SMTP_PORT')) || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secureConfig = this.configService.get<string | boolean>(
      'SMTP_SECURE',
    );
    const secure =
      secureConfig === true || secureConfig === 'true' || port === 465;
    const fromAddress =
      this.configService.get<string>('MAIL_FROM') ||
      (user ? `"ToolHub" <${user}>` : '"ToolHub" <no-reply@toolhub.local>');

    const subject = '[ToolHub] Mã xác minh tài khoản của bạn (OTP)';
    const html = this.buildOtpEmailHtml(code, verifyLink, toEmail);
    const text = `Xin chào,\n\nMã xác minh OTP của bạn tại ToolHub là: ${code}\nMã có hiệu lực trong 30 phút.\n\nHoặc bấm vào liên kết sau để kích hoạt tài khoản: ${verifyLink}\n\nTrân trọng,\nToolHub Team`;

    // 1. Trường hợp đã cấu hình đầy đủ SMTP_USER và SMTP_PASS
    if (user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
        });

        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text,
          html,
        });

        this.logger.log(
          `✅ [SMTP] Đã gửi email xác minh OTP thành công tới: ${toEmail} (MessageId: ${info.messageId})`,
        );
        return true;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `❌ [SMTP ERROR] Không thể gửi email qua SMTP: ${errorMsg}`,
        );
        // Không throw lỗi làm crash luồng đăng ký của người dùng, giữ log rõ ràng
        return false;
      }
    }

    // 2. Trường hợp chưa cấu hình credentials: Thử nghiệm tạo tài khoản Ethereal hoặc fallback an toàn
    this.logger.warn(
      `⚠️ [MailerService] Chưa tìm thấy cấu hình SMTP_USER / SMTP_PASS trong .env. Khởi tạo phiên thử nghiệm (Ethereal / Console)...`,
    );

    try {
      // Tự động dùng tài khoản Ethereal thực tế để tạo hộp thư xem trước
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await testTransporter.sendMail({
        from: '"ToolHub" <no-reply@toolhub.local>',
        to: toEmail,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(
          `🔗 [Ethereal Preview URL] Xem hộp thư email thực tế tại: ${previewUrl}`,
        );
      }
      return true;
    } catch {
      this.logger.log(
        `ℹ️ [Dev Mode] Đã hoàn tất xử lý OTP qua Terminal Console (OTP: ${code}). Vui lòng cấu hình SMTP_USER và SMTP_PASS trong .env để gửi email thật.`,
      );
      return true;
    }
  }
}
