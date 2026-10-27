"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { requestPasswordReset } from "../api/password-reset.api";
import { isValidEmail } from "../lib/validate-password-reset";
import { passwordResetErrorKey } from "../lib/map-password-reset-error";
import { PasswordResetError } from "../types/password-reset.types";
import { AuthCard, BackToLogin, useAuthCopy } from "./auth-shell";
import { AuthIcon } from "./auth-icons";
import styles from "../password-reset.module.css";

export function ForgotPasswordForm() {
  const { t } = useAuthCopy();
  const [email, setEmail] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<ReturnType<
    typeof passwordResetErrorKey
  > | null>(null);
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef(0);
  const submitting = useRef(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const statusTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (received) statusTitle.current?.focus();
  }, [received]);

  function wait(seconds: number) {
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (submitting.current || remaining > 0) return;
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailInvalid(true);
      emailInput.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    setResent(false);
    try {
      const retryAfter = await requestPasswordReset(normalizedEmail);
      if (received) setResent(true);
      setReceived(true);
      wait(retryAfter);
    } catch (failure) {
      setError(passwordResetErrorKey(failure));
      if (
        failure instanceof PasswordResetError &&
        failure.code === "RATE_LIMITED"
      ) {
        wait(failure.retryAfter);
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const buttonLabel = busy
    ? t.sending
    : remaining > 0
      ? `${t.resendAfter} ${remaining} ${t.seconds}`
      : received
        ? t.resend
        : t.send;

  if (received) {
    return (
      <AuthCard
        icon="mail"
        title={t.receivedTitle}
        description={t.receivedDescription}
      >
        <h2 ref={statusTitle} tabIndex={-1} className={styles.srOnly}>
          {t.receivedTitle}
        </h2>
        <div className={styles.infoBox}>
          <AuthIcon name="mail" />
          <p>{t.spam}</p>
        </div>
        {error && (
          <p className={styles.alert} role="alert">
            {t[error]}
          </p>
        )}
        {resent && (
          <p className={styles.notice} role="status">
            {t.resent}
          </p>
        )}
        <button
          className={`${styles.button} ${styles.secondary}`}
          type="button"
          onClick={() => void submit()}
          disabled={busy || remaining > 0}
        >
          {buttonLabel}
        </button>
        <button
          className={styles.quietButton}
          type="button"
          disabled={busy || remaining > 0}
          onClick={() => {
            setReceived(false);
            setError(null);
            setResent(false);
            setEmail("");
          }}
        >
          {t.otherEmail}
        </button>
        <BackToLogin />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon="lock"
      title={t.forgotTitle}
      description={t.forgotDescription}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={submit}
        aria-busy={busy}
      >
        <div className={styles.field}>
          <label htmlFor="reset-email">{t.email}</label>
          <div className={styles.emailControl}>
            <AuthIcon name="mail" />
            <input
              ref={emailInput}
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              placeholder={t.emailPlaceholder}
              value={email}
              disabled={busy}
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "email-error" : undefined}
              onBlur={() => {
                if (email.trim()) setEmailInvalid(!isValidEmail(email.trim()));
              }}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailInvalid(false);
                setError(null);
              }}
            />
          </div>
          {emailInvalid && (
            <p id="email-error" className={styles.fieldError} role="alert">
              {t.invalidEmail}
            </p>
          )}
        </div>
        {error && (
          <p className={styles.alert} role="alert">
            {t[error]}
          </p>
        )}
        <button
          className={styles.button}
          type="submit"
          disabled={busy || remaining > 0}
        >
          {busy && <span className={styles.spinner} />}
          {buttonLabel}
          {!busy && remaining === 0 && <span aria-hidden="true">→</span>}
        </button>
        <p className={styles.expiry}>
          <AuthIcon name="clock" />
          {t.expiry}
        </p>
      </form>
      <BackToLogin />
    </AuthCard>
  );
}
