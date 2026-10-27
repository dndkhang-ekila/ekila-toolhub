"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { resetPassword, validateResetToken } from "../api/password-reset.api";
import { isUsableResetToken } from "../lib/validate-password-reset";
import { passwordResetErrorKey } from "../lib/map-password-reset-error";
import { PasswordResetError } from "../types/password-reset.types";
import { AuthCard, BackToLogin, loginUrl, useAuthCopy } from "./auth-shell";
import { AuthIcon } from "./auth-icons";
import styles from "../password-reset.module.css";

function ResetTokenForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const { t } = useAuthCopy();
  const [status, setStatus] = useState<
    "checking" | "ready" | "invalid" | "failed"
  >("checking");
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef(0);
  const [error, setError] = useState<ReturnType<
    typeof passwordResetErrorKey
  > | null>(null);
  const submitting = useRef(false);
  const passwordInput = useRef<HTMLInputElement>(null);
  const confirmInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    validateResetToken(token, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setStatus("ready");
        }
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (
          failure instanceof PasswordResetError &&
          failure.code === "RESET_LINK_INVALID"
        ) {
          setStatus("invalid");
        } else {
          if (
            failure instanceof PasswordResetError &&
            failure.code === "RATE_LIMITED"
          ) {
            deadline.current = Date.now() + failure.retryAfter * 1000;
            setRemaining(failure.retryAfter);
          }
          setError(passwordResetErrorKey(failure));
          setStatus("failed");
        }
      });
    return () => controller.abort();
  }, [token, attempt]);

  const mismatch = confirmation.length > 0 && password !== confirmation;
  const passwordError = submitted && !password;
  const confirmationError = mismatch || (submitted && !confirmation);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || remaining > 0) return;
    setSubmitted(true);
    setError(null);
    if (!password) {
      passwordInput.current?.focus();
      return;
    }
    if (!confirmation || mismatch) {
      confirmInput.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await resetPassword(token, password);
      setPassword("");
      setConfirmation("");
      onSuccess();
    } catch (failure) {
      if (
        failure instanceof PasswordResetError &&
        failure.code === "RESET_LINK_INVALID"
      ) {
        setPassword("");
        setConfirmation("");
        setStatus("invalid");
      } else {
        if (
          failure instanceof PasswordResetError &&
          failure.code === "RATE_LIMITED"
        ) {
          deadline.current = Date.now() + failure.retryAfter * 1000;
          setRemaining(failure.retryAfter);
        }
        setError(passwordResetErrorKey(failure));
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (status === "checking") return <CheckingResetLink />;
  if (status === "invalid") return <InvalidResetLink />;
  if (status === "failed")
    return (
      <AuthCard
        icon="clock"
        title={t.checkFailed}
        description={t[error || "unavailable"]}
      >
        <button
          className={styles.button}
          type="button"
          disabled={remaining > 0}
          onClick={() => {
            setStatus("checking");
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          {remaining > 0
            ? `${t.resendAfter} ${remaining} ${t.seconds}`
            : t.retry}
        </button>
        <BackToLogin />
      </AuthCard>
    );

  return (
    <AuthCard icon="lock" title={t.resetTitle} description={t.resetDescription}>
      <form
        className={styles.form}
        noValidate
        onSubmit={submit}
        aria-busy={busy}
      >
        <div className={styles.field}>
          <label htmlFor="new-password">{t.password}</label>
          <div className={styles.passwordControl}>
            <input
              ref={passwordInput}
              id="new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              placeholder={t.passwordPlaceholder}
              disabled={busy}
              aria-invalid={passwordError}
              aria-describedby={
                passwordError ? "new-password-error" : "password-hint"
              }
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
            />
            <button
              type="button"
              className={styles.eyeButton}
              aria-label={showPassword ? t.hide : t.show}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <AuthIcon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>
          {passwordError && (
            <p
              id="new-password-error"
              className={styles.fieldError}
              role="alert"
            >
              {t.passwordRequired}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="confirm-password">{t.confirm}</label>
          <div className={styles.passwordControl}>
            <input
              ref={confirmInput}
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmation}
              placeholder={t.confirmPlaceholder}
              disabled={busy}
              aria-invalid={confirmationError}
              aria-describedby={
                confirmationError ? "confirm-password-error" : undefined
              }
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError(null);
              }}
            />
            <button
              type="button"
              className={styles.eyeButton}
              aria-label={showConfirmation ? t.hide : t.show}
              aria-pressed={showConfirmation}
              onClick={() => setShowConfirmation(!showConfirmation)}
            >
              <AuthIcon name={showConfirmation ? "eye-off" : "eye"} />
            </button>
          </div>
          {confirmationError && (
            <p
              id="confirm-password-error"
              className={styles.fieldError}
              role="alert"
            >
              {mismatch ? t.mismatch : t.confirmRequired}
            </p>
          )}
        </div>
        <p id="password-hint" className={styles.passwordHint}>
          {t.hint}
        </p>
        {error && (
          <p className={styles.alert} role="alert">
            {t[error]}
          </p>
        )}
        <button
          type="submit"
          className={styles.button}
          disabled={busy || mismatch || remaining > 0}
        >
          {busy && <span className={styles.spinner} />}
          {busy
            ? t.saving
            : remaining > 0
              ? `${t.resendAfter} ${remaining} ${t.seconds}`
              : t.save}
        </button>
      </form>
      <BackToLogin />
    </AuthCard>
  );
}

export function InvalidResetLink() {
  const { t } = useAuthCopy();
  return (
    <AuthCard
      icon="clock"
      title={t.invalidTitle}
      description={t.invalidDescription}
    >
      <Link href="/forgot-password" className={styles.button}>
        {t.newLink}
        <span aria-hidden="true">→</span>
      </Link>
      <BackToLogin />
    </AuthCard>
  );
}

export function CheckingResetLink() {
  const { t } = useAuthCopy();
  return (
    <AuthCard icon="lock" title={t.checkTitle} description={t.checking}>
      <p role="status" className={styles.loading}>
        <span className={styles.spinner} />
        <span className={styles.srOnly}>{t.checking}</span>
      </p>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const [completed, setCompleted] = useState(false);
  const values = params.getAll("token");
  const token = values.length === 1 ? values[0] : "";
  if (completed) return <ResetPasswordSuccess />;
  return isUsableResetToken(token) ? (
    <ResetTokenForm
      key={token}
      token={token}
      onSuccess={() => {
        setCompleted(true);
        window.history.replaceState(null, "", window.location.pathname);
      }}
    />
  ) : (
    <InvalidResetLink />
  );
}

function ResetPasswordSuccess() {
  const { t } = useAuthCopy();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <AuthCard
      icon="check"
      title={t.successTitle}
      description={t.successDescription}
    >
      <h2 ref={heading} tabIndex={-1} className={styles.srOnly}>
        {t.successTitle}
      </h2>
      <Link href={loginUrl} className={styles.button}>
        {t.login}
        <span aria-hidden="true">→</span>
      </Link>
      <p className={styles.bottomNote}>{t.successNote}</p>
    </AuthCard>
  );
}
