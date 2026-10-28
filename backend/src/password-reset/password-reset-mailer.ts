import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class PasswordResetMailer implements OnModuleDestroy {
  private readonly transport?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly mode: string;
  private readonly frontend: URL;
  private readonly directory: string;

  constructor(private readonly config: ConfigService) {
    const production = config.get<string>('NODE_ENV') === 'production';
    this.mode = config.get<string>(
      'PASSWORD_RESET_MAIL_MODE',
      production ? 'smtp' : 'local',
    );
    this.frontend = new URL(
      config.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    );
    if (
      !['http:', 'https:'].includes(this.frontend.protocol) ||
      this.frontend.username ||
      this.frontend.password ||
      (production && this.frontend.protocol !== 'https:')
    ) {
      throw new Error('Invalid FRONTEND_URL for password reset');
    }
    this.directory =
      config.get<string>('PASSWORD_RESET_MAIL_DIR') ||
      resolve(process.cwd(), 'data/mailbox');
    if (this.mode === 'local' && !production) return;
    if (this.mode !== 'smtp')
      throw new Error('Local mailbox is disabled in production');
    const host = config.get<string>('SMTP_HOST');
    const from = config.get<string>('SMTP_FROM');
    if (!host || !from) throw new Error('SMTP_HOST and SMTP_FROM are required');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASSWORD');
    if (!!user !== !!pass)
      throw new Error('SMTP credentials must include both user and password');
    const secure = config.get<string>('SMTP_SECURE', 'false') === 'true';
    const port = Number(
      config.get<string>('SMTP_PORT', secure ? '465' : '587'),
    );
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid SMTP_PORT');
    }
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: true,
      ...(user && pass ? { auth: { user, pass } } : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
    });
  }

  async send(
    id: string,
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const link = new URL('/reset-password', this.frontend);
    link.searchParams.set('token', token);
    const text = [
      'ToolHub — Đặt lại mật khẩu',
      'Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau để tiếp tục:',
      link.href,
      `Liên kết hết hạn lúc ${expiresAt.toISOString()} (30 phút kể từ khi tạo).`,
      'Nếu bạn không yêu cầu, hãy bỏ qua email này. Không chia sẻ liên kết với người khác.',
    ].join('\n\n');
    if (this.mode === 'local') {
      await mkdir(this.directory, { recursive: true });
      await writeFile(
        resolve(this.directory, `${id}.json`),
        JSON.stringify({
          id,
          to: email,
          subject: 'ToolHub — Đặt lại mật khẩu',
          text,
          link: link.href,
          expiresAt: expiresAt.toISOString(),
        }),
        { encoding: 'utf8', mode: 0o600 },
      );
      return;
    }
    if (!this.transport) throw new Error('Email transport unavailable');
    const result = await this.transport.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: email,
      subject: 'ToolHub — Đặt lại mật khẩu',
      text,
      messageId: `<reset-${id}@toolhub.local>`,
    });
    if (Array.isArray(result.rejected) && result.rejected.length)
      throw new Error('Email rejected');
  }

  onModuleDestroy(): void {
    this.transport?.close();
  }
}
