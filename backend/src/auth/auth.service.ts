import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { EmailDeliveryResult, MailerService } from './mailer.service';

export interface SanitizedUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  locale: string;
  isEmailVerified: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Băm mật khẩu bằng thuật toán bcrypt theo chuẩn SRS NFR-SEC-02
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Đối chiếu mật khẩu người dùng với chuỗi hash trong Database
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Sinh cặp mã OTP 6 chữ số ngẫu nhiên an toàn, token URL và thời hạn 30 phút
   */
  private createVerificationTokens() {
    const verificationCode = randomInt(100000, 1000000).toString();
    const verificationToken = randomBytes(24).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    return { verificationCode, verificationToken, verificationExpiresAt };
  }

  /**
   * Gửi email xác minh và lấy chi tiết kết quả gửi (hỗ trợ mock cũ trong unit test)
   */
  private async dispatchVerificationEmail(
    email: string,
    code: string,
    token: string,
  ): Promise<EmailDeliveryResult> {
    const withResult = (
      this.mailerService as unknown as {
        sendVerificationEmailWithResult?: (
          to: string,
          otp: string,
          tok: string,
        ) => Promise<EmailDeliveryResult>;
      }
    ).sendVerificationEmailWithResult;

    if (typeof withResult === 'function') {
      return await withResult.call(this.mailerService, email, code, token);
    }

    const sent = await this.mailerService.sendVerificationEmail(
      email,
      code,
      token,
    );
    return {
      sent,
      mode: sent ? 'smtp' : 'failed',
    };
  }

  /**
   * Đăng ký tài khoản mới bằng Email + Mật khẩu
   * POST /api/v1/auth/register
   */
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isEmailVerified === false) {
        throw new BadRequestException(
          'Địa chỉ email này đã được đăng ký nhưng chưa xác minh. Vui lòng kiểm tra hộp thư hoặc yêu cầu gửi lại mã xác minh.',
        );
      }
      throw new BadRequestException(
        'Địa chỉ email này đã được đăng ký tài khoản.',
      );
    }

    // Băm mật khẩu bảo mật cao (NFR-SEC-02)
    const passwordHash = await this.hashPassword(dto.password);

    // Tạo mã OTP 6 chữ số và Token xác minh email
    const { verificationCode, verificationToken, verificationExpiresAt } =
      this.createVerificationTokens();

    const newUser = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      role: 'free',
      plan: 'free',
      locale: dto.locale || 'vi',
      isEmailVerified: false,
      verificationCode,
      verificationToken,
      verificationExpiresAt,
      tokenVersion: 1,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Gửi email xác thực
    const delivery = await this.dispatchVerificationEmail(
      savedUser.email,
      verificationCode,
      verificationToken,
    );

    const isRealMailSent = delivery.sent && delivery.mode === 'smtp';

    if (!isRealMailSent) {
      this.logger.warn(
        `[register] Tài khoản ${savedUser.email} đã được tạo nhưng email thật chưa được gửi (mode=${delivery.mode}${delivery.error ? `, error=${delivery.error}` : ''}).`,
      );
    }

    const message = isRealMailSent
      ? 'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác minh tài khoản.'
      : delivery.mode === 'failed'
        ? 'Tài khoản đã được tạo nhưng máy chủ gặp lỗi khi gửi email xác minh qua SMTP. Vui lòng kiểm tra cấu hình SMTP hoặc thử gửi lại.'
        : 'Tài khoản đã được tạo, nhưng máy chủ chưa cấu hình SMTP thật (SMTP_USER / SMTP_PASS trong backend/.env) nên email chưa thể gửi tới hộp thư cá nhân.';

    return {
      success: true,
      emailSent: isRealMailSent,
      deliveryMode: delivery.mode,
      ...(delivery.error ? { emailError: delivery.error } : {}),
      message,
      requiresEmailVerification: true,
      verificationEmail: savedUser.email,
    };
  }

  /**
   * Đăng nhập bằng Email + Mật khẩu
   * POST /api/v1/auth/login
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // Nếu không tồn tại user -> trả về lỗi 401 chuẩn
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Nếu tài khoản chỉ đăng nhập qua Google, không có mật khẩu
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Tài khoản này được đăng ký thông qua Google. Vui lòng chọn "Đăng nhập bằng Google".',
      );
    }

    // Đối chiếu mật khẩu bằng bcrypt
    const isPasswordValid = await this.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Kiểm tra trạng thái xác minh email
    if (!user.isEmailVerified) {
      return {
        success: false,
        requiresEmailVerification: true,
        message:
          'Tài khoản chưa được xác minh email. Vui lòng xác minh để tiếp tục.',
        verificationEmail: user.email,
      };
    }

    // Tạo JWT Access Token thật
    const accessToken = await this.generateToken(user);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
      },
    };
  }

  /**
   * Xác minh email qua mã OTP 6 số hoặc Token từ link
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(dto: VerifyEmailDto) {
    let user: User | null = null;
    const normalizedEmail = dto.email?.trim().toLowerCase();

    if (dto.token) {
      user = await this.userRepository.findOne({
        where: { verificationToken: dto.token.trim() },
      });
    } else if (normalizedEmail && dto.code) {
      user = await this.userRepository.findOne({
        where: { email: normalizedEmail, verificationCode: dto.code.trim() },
      });
    } else if (dto.code) {
      user = await this.userRepository.findOne({
        where: { verificationCode: dto.code.trim() },
      });
    }

    if (!user) {
      throw new BadRequestException(
        'Mã hoặc liên kết xác minh không chính xác.',
      );
    }

    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      throw new BadRequestException(
        'Mã xác minh đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.',
      );
    }

    // Cập nhật trạng thái đã kích hoạt
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationToken = null;
    user.verificationExpiresAt = null;

    await this.userRepository.save(user);

    const accessToken = await this.generateToken(user);

    return {
      success: true,
      message: 'Xác minh email thành công!',
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
      },
    };
  }

  /**
   * Gửi lại mã xác minh email
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(dto: ResendVerificationDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản với email này.');
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        emailSent: true,
        message: 'Tài khoản của bạn đã được xác minh trước đó.',
      };
    }

    const { verificationCode, verificationToken, verificationExpiresAt } =
      this.createVerificationTokens();

    user.verificationCode = verificationCode;
    user.verificationToken = verificationToken;
    user.verificationExpiresAt = verificationExpiresAt;

    await this.userRepository.save(user);

    const delivery = await this.dispatchVerificationEmail(
      user.email,
      verificationCode,
      verificationToken,
    );

    const isRealMailSent = delivery.sent && delivery.mode === 'smtp';

    if (!isRealMailSent) {
      return {
        success: false,
        emailSent: false,
        deliveryMode: delivery.mode,
        ...(delivery.error ? { emailError: delivery.error } : {}),
        message:
          delivery.mode === 'failed'
            ? `Không thể gửi email xác minh qua SMTP: ${delivery.error || 'Lỗi kết nối máy chủ thư.'}`
            : 'Máy chủ chưa cấu hình SMTP thật (SMTP_USER / SMTP_PASS trong backend/.env), nên chưa thể gửi email tới hộp thư cá nhân.',
      };
    }

    return {
      success: true,
      emailSent: true,
      deliveryMode: 'smtp',
      message: `Mã xác minh mới đã được gửi tới ${user.email}. Vui lòng kiểm tra hộp thư.`,
    };
  }

  /**
   * Đăng nhập hoặc Tạo tài khoản bằng Google OAuth
   * POST /api/v1/auth/google
   */
  async googleAuth(dto: GoogleAuthDto) {
    // Trích xuất email & thông tin từ token Google hoặc fallback dev
    let googleId = 'google_' + randomBytes(8).toString('hex');
    let email = 'google.user@toolhub.local';
    let name = 'Google User';
    let avatarUrl: string | null = null;

    if (dto.credential) {
      try {
        // TODO: In production, verify id_token using google-auth-library OAuth2Client.verifyIdToken()
        // Nếu là JWT credential từ Google (id_token)
        const parts = dto.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const googlePayload = JSON.parse(payloadJson) as Record<
            string,
            unknown
          >;
          if (typeof googlePayload.email === 'string') {
            email = googlePayload.email.toLowerCase();
          }
          if (typeof googlePayload.sub === 'string') {
            googleId = googlePayload.sub;
          }
          if (typeof googlePayload.name === 'string') {
            name = googlePayload.name;
          }
          if (typeof googlePayload.picture === 'string') {
            avatarUrl = googlePayload.picture;
          }
        }
      } catch (err) {
        this.logger.warn(`Không thể giải mã Google credential: ${String(err)}`);
      }
    }

    let user = await this.userRepository.findOne({
      where: [{ googleId }, { email }],
    });

    if (!user) {
      user = this.userRepository.create({
        email,
        googleId,
        name,
        avatarUrl,
        role: 'free',
        plan: 'free',
        locale: 'vi',
        isEmailVerified: true,
        tokenVersion: 1,
      });
      user = await this.userRepository.save(user);
    } else {
      let shouldUpdate = false;
      if (!user.googleId) {
        user.googleId = googleId;
        shouldUpdate = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        shouldUpdate = true;
      }
      if (shouldUpdate) {
        user = await this.userRepository.save(user);
      }
    }

    const accessToken = await this.generateToken(user);

    return {
      success: true,
      message: 'Đăng nhập bằng Google thành công!',
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
      },
    };
  }

  /**
   * Lấy thông tin tài khoản người dùng hiện tại
   */
  async getProfile(userId: string): Promise<SanitizedUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Tạo JWT Token thật ký bởi secret key
   */
  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      tokenVersion: user.tokenVersion,
    };
    return await this.jwtService.signAsync(payload);
  }

  /**
   * Chuẩn hoá thông tin trả về, tuyệt đối không lộ passwordHash, verificationCode (NFR-SEC-02)
   */
  sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      locale: user.locale,
      isEmailVerified: user.isEmailVerified,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
