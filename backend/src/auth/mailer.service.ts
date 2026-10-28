import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gửi email chứa mã OTP và link xác minh theo chuẩn SRS Table 8 (Dịch vụ email giao dịch)
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

    // Giả lập tác vụ gửi email giao dịch OTP qua console log cho môi trường dev/staging
    // TODO: Integrate actual SMTP / transactional email provider (SendGrid, Resend, or AWS SES) for production
    await Promise.resolve();

    return true;
  }
}
