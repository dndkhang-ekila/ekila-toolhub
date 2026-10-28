"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { AuthIcon } from "./auth-icons";
import styles from "../password-reset.module.css";

const messages = {
  vi: {
    language: "Ngôn ngữ",
    eyebrow: "KHÔI PHỤC TÀI KHOẢN",
    privacy: "Bảo mật tài khoản của bạn",
    footer: "Một tài khoản. Mọi tiện ích.",
    guideTitle: "Quay lại ToolHub,\nthật đơn giản.",
    guideDescription:
      "Khôi phục quyền truy cập bằng email liên kết với tài khoản của bạn.",
    guideStepEmail: "Nhập email tài khoản",
    guideStepEmailHint: "Sử dụng email bạn đã đăng ký với ToolHub.",
    guideStepLink: "Kiểm tra hộp thư",
    guideStepLinkHint: "Mở liên kết khôi phục nếu bạn nhận được email.",
    guideStepPassword: "Tạo mật khẩu mới",
    guideStepPasswordHint: "Xác nhận mật khẩu và quay lại đăng nhập.",
    guideNote: "Không chia sẻ liên kết khôi phục với người khác.",
    forgotTitle: "Quên mật khẩu?",
    forgotDescription:
      "Không sao cả. Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.",
    email: "Địa chỉ email",
    emailPlaceholder: "Nhập email của bạn",
    send: "Gửi liên kết",
    sending: "Đang gửi…",
    expiry: "Liên kết có hiệu lực trong 30 phút.",
    back: "Quay lại đăng nhập",
    receivedTitle: "Kiểm tra email của bạn",
    receivedDescription:
      "Nếu email này liên kết với tài khoản đủ điều kiện, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
    spam: "Chưa thấy email? Hãy kiểm tra cả thư mục Spam hoặc thư rác.",
    resend: "Gửi lại liên kết",
    resendAfter: "Gửi lại sau",
    seconds: "giây",
    otherEmail: "Sử dụng email khác",
    resent: "Yêu cầu gửi lại đã được tiếp nhận.",
    resetTitle: "Đặt lại mật khẩu",
    resetDescription: "Tạo mật khẩu mới để bảo vệ tài khoản của bạn.",
    password: "Mật khẩu mới",
    confirm: "Xác nhận mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu mới",
    confirmPlaceholder: "Nhập lại mật khẩu mới",
    hint: "Sử dụng mật khẩu theo yêu cầu của tài khoản.",
    save: "Lưu mật khẩu mới",
    saving: "Đang cập nhật…",
    show: "Hiện mật khẩu",
    hide: "Ẩn mật khẩu",
    invalidTitle: "Liên kết không còn hiệu lực",
    invalidDescription:
      "Liên kết không hợp lệ hoặc đã hết hạn. Yêu cầu liên kết mới để tiếp tục.",
    newLink: "Yêu cầu liên kết mới",
    successTitle: "Mật khẩu đã được cập nhật",
    successDescription:
      "Bạn có thể đăng nhập bằng mật khẩu mới để tiếp tục sử dụng ToolHub.",
    login: "Đăng nhập",
    successNote: "Bạn có thể đóng trang này.",
    checking: "Đang kiểm tra liên kết…",
    checkTitle: "Kiểm tra liên kết",
    checkFailed: "Chưa thể kiểm tra liên kết",
    retry: "Thử lại",
    invalidEmail: "Nhập địa chỉ email hợp lệ.",
    passwordRequired: "Nhập mật khẩu mới.",
    confirmRequired: "Nhập lại mật khẩu mới để xác nhận.",
    mismatch: "Mật khẩu xác nhận chưa khớp.",
    passwordPolicy:
      "Mật khẩu chưa đáp ứng chính sách tài khoản. Vui lòng chọn mật khẩu khác.",
    rateLimited:
      "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ trước khi thử lại.",
    unavailable: "Dịch vụ hiện chưa khả dụng. Vui lòng thử lại sau.",
    network: "Không thể kết nối đến dịch vụ. Kiểm tra kết nối và thử lại.",
    errorLabel: "Không thể hoàn tất yêu cầu",
  },
  en: {
    language: "Language",
    eyebrow: "ACCOUNT RECOVERY",
    privacy: "Your account, protected",
    footer: "One account. Everyday tools.",
    guideTitle: "Back to ToolHub,\nin a few steps.",
    guideDescription: "Recover access using the email linked to your account.",
    guideStepEmail: "Enter your account email",
    guideStepEmailHint: "Use the email you registered with ToolHub.",
    guideStepLink: "Check your inbox",
    guideStepLinkHint: "Open the recovery link if you receive an email.",
    guideStepPassword: "Create a new password",
    guideStepPasswordHint: "Confirm your password and return to sign in.",
    guideNote: "Keep your recovery link private. Do not share it.",
    forgotTitle: "Forgot your password?",
    forgotDescription:
      "It happens. Enter your email to receive password reset instructions.",
    email: "Email address",
    emailPlaceholder: "Enter your email",
    send: "Send reset link",
    sending: "Sending…",
    expiry: "The link is valid for 30 minutes.",
    back: "Back to sign in",
    receivedTitle: "Check your email",
    receivedDescription:
      "If this email belongs to an eligible account, you will receive password reset instructions.",
    spam: "No email yet? Check your spam or junk folder too.",
    resend: "Send another link",
    resendAfter: "Send again in",
    seconds: "seconds",
    otherEmail: "Use a different email",
    resent: "Your new request has been received.",
    resetTitle: "Reset your password",
    resetDescription: "Create a new password to keep your account secure.",
    password: "New password",
    confirm: "Confirm password",
    passwordPlaceholder: "Enter a new password",
    confirmPlaceholder: "Enter the new password again",
    hint: "Follow the password requirements for your account.",
    save: "Save new password",
    saving: "Updating…",
    show: "Show password",
    hide: "Hide password",
    invalidTitle: "This link is no longer valid",
    invalidDescription:
      "This link is invalid or has expired. Request a new link to continue.",
    newLink: "Request a new link",
    successTitle: "Your password has been updated",
    successDescription:
      "Sign in with your new password to continue using ToolHub.",
    login: "Sign in",
    successNote: "You can close this page.",
    checking: "Checking your reset link…",
    checkTitle: "Checking your link",
    checkFailed: "Unable to check this link",
    retry: "Try again",
    invalidEmail: "Enter a valid email address.",
    passwordRequired: "Enter a new password.",
    confirmRequired: "Enter your new password again.",
    mismatch: "The passwords do not match.",
    passwordPolicy:
      "This password does not meet your account policy. Please choose another password.",
    rateLimited: "Too many requests. Please wait before trying again.",
    unavailable:
      "This service is currently unavailable. Please try again later.",
    network: "Unable to connect. Check your connection and try again.",
    errorLabel: "Unable to complete your request",
  },
};

type Locale = keyof typeof messages;
type Messages = typeof messages.vi;
const AuthContext = createContext<{ t: Messages; locale: Locale } | null>(null);

export function useAuthCopy() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("Auth context is required");
  return context;
}

export const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

export function AuthShell({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  const t = messages[locale];
  return (
    <AuthContext.Provider value={{ t, locale }}>
      <div className={styles.shell} lang={locale}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="ToolHub">
            Tool<span>Hub</span>
            <span className={styles.brandDot} />
          </Link>
          <label className={styles.language}>
            <span className={styles.srOnly}>{t.language}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z" />
            </svg>
            <select
              aria-label={t.language}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
        </header>
        <main className={styles.main}>
          <div className={styles.authContent}>
            <aside
              className={styles.guide}
              aria-labelledby="recovery-guide-title"
            >
              <div className={styles.guideBadge}>
                <AuthIcon name="shield" />
              </div>
              <div>
                <p className={styles.eyebrow}>{t.eyebrow}</p>
                <h2 id="recovery-guide-title" className={styles.guideTitle}>
                  {t.guideTitle}
                </h2>
                <p className={styles.guideDescription}>{t.guideDescription}</p>
              </div>
              <ol className={styles.guideSteps}>
                {[
                  [t.guideStepEmail, t.guideStepEmailHint],
                  [t.guideStepLink, t.guideStepLinkHint],
                  [t.guideStepPassword, t.guideStepPasswordHint],
                ].map(([title, hint], index) => (
                  <li key={index}>
                    <span className={styles.stepNumber} aria-hidden="true">
                      {index + 1}
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{hint}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={styles.guideNote}>
                <AuthIcon name="lock" />
                {t.guideNote}
              </p>
            </aside>
            {children}
          </div>
          <p className={styles.security}>
            <AuthIcon name="shield" />
            {t.privacy}
          </p>
        </main>
        <footer className={styles.footer}>
          <span>© ToolHub</span>
          <span>{t.footer}</span>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}

export function AuthCard({
  icon,
  title,
  description,
  children,
}: {
  icon: "lock" | "mail" | "check" | "clock";
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.card} aria-labelledby="auth-title">
      <div className={styles.iconBadge}>
        <AuthIcon name={icon} />
      </div>
      <h1 id="auth-title" className={styles.title}>
        {title}
      </h1>
      <p className={styles.description}>{description}</p>
      {children}
    </section>
  );
}

export function BackToLogin() {
  const { t } = useAuthCopy();
  return (
    <div className={styles.backRow}>
      <Link href={loginUrl} className={styles.textLink}>
        <AuthIcon name="arrow" />
        {t.back}
      </Link>
    </div>
  );
}
