"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { usePageTitle } from "@/lib/use-page-title";
import { urlPolicyCopy } from "../lib/url-policy.copy";
import { checkUrlPolicy } from "../lib/check-url-policy";
import {
  checkUrlOnServer,
  type ServerUrlPolicyResult,
} from "../api/check-url.api";
import { PolicyIcon } from "./policy-icon";
import styles from "../url-policy.module.css";

export function UrlPolicyForm() {
  const { locale } = useLanguage();
  const t = urlPolicyCopy[locale];
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ServerUrlPolicyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const blocked =
    result?.kind === "blocked-toolhub" ||
    result?.kind === "blocked-shortener" ||
    result?.kind === "blocked-redirect" ||
    result?.kind === "blocked-target";
  const invalid = result?.kind === "invalid";
  const allowed = result?.kind === "allowed";
  usePageTitle(t.pageTitle);

  useEffect(
    () => () => {
      revision.current++;
      active.current?.abort();
    },
    [],
  );

  function cancel() {
    revision.current++;
    active.current?.abort();
    active.current = null;
    setBusy(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    const local = checkUrlPolicy(url, [], []);
    if (local.kind === "invalid") {
      setResult(local);
      input.current?.focus();
      return;
    }
    const controller = new AbortController();
    const current = ++revision.current;
    active.current = controller;
    setBusy(true);
    setResult(null);
    try {
      const next = await checkUrlOnServer(url, controller.signal);
      if (current !== revision.current) return;
      setResult(next);
      if (next.kind === "invalid") input.current?.focus();
      else requestAnimationFrame(() => status.current?.focus());
    } catch {
      if (current === revision.current && !controller.signal.aborted)
        setResult({
          kind: "unverified",
          message: "Chưa thể xác minh liên kết. Vui lòng thử lại.",
        });
    } finally {
      if (current === revision.current) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  function clear() {
    cancel();
    setUrl("");
    setResult(null);
    input.current?.focus();
  }

  const title = invalid
    ? t.invalidTitle
    : blocked
      ? t.blockedTitle
      : result?.kind === "rate-limited"
        ? t.limitedTitle
        : result?.kind === "unverified"
          ? t.unavailableTitle
          : t.allowedTitle;
  const description =
    result?.kind === "blocked-toolhub"
      ? t.toolhub
      : result?.kind === "blocked-shortener"
        ? t.shortener
        : result && "message" in result
          ? locale === "vi"
            ? result.message
            : result.kind === "invalid"
              ? t.invalid
              : result.kind === "blocked-redirect"
                ? t.redirect
                : result.kind === "blocked-target"
                  ? t.unsafe
                  : result.kind === "rate-limited"
                    ? `Too many requests. Try again in ${result.retryAfter ?? 60} seconds.`
                    : t.unavailable
          : t.allowed;

  return (
    <div className={styles.shell} lang={locale}>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className={styles.subtitle}>{t.subtitle}</p>
          </div>

          <section className={styles.panel} aria-labelledby="url-policy-title">
            <div className={styles.panelHeading}>
              <span className={styles.iconTile}>
                <PolicyIcon name="link" />
              </span>
              <div>
                <h2 id="url-policy-title">{t.panelTitle}</h2>
                <p>{t.panelHint}</p>
              </div>
            </div>

            <form noValidate onSubmit={submit} aria-busy={busy}>
              <label htmlFor="original-url" className={styles.label}>
                {t.input}
              </label>
              <div
                className={`${styles.inputWrap} ${blocked || invalid ? styles.inputError : ""}`}
              >
                <PolicyIcon name="link" className={styles.inputIcon} />
                <input
                  ref={input}
                  id="original-url"
                  name="url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={url}
                  placeholder="https://example.com/bai-viet"
                  aria-invalid={blocked || invalid ? true : undefined}
                  aria-describedby={`url-help${result ? " url-policy-description" : ""}`}
                  onChange={(event) => {
                    cancel();
                    setUrl(event.target.value);
                    setResult(null);
                  }}
                />
                {url && (
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={clear}
                    aria-label={t.clear}
                  >
                    <PolicyIcon name="close" />
                  </button>
                )}
              </div>
              <p id="url-help" className={styles.helper}>
                {t.helper}
              </p>

              {result ? (
                <div
                  ref={status}
                  tabIndex={-1}
                  role={allowed ? "status" : "alert"}
                  className={`${styles.result} ${allowed ? styles.supported : styles.rejected}`}
                >
                  <PolicyIcon
                    name={allowed ? "check" : "block"}
                    className={styles.resultIcon}
                  />
                  <div className={styles.resultCopy}>
                    <h3>{title}</h3>
                    <p id="url-policy-description">{description}</p>
                    {"hostname" in result && (
                      <span className={styles.domain}>
                        {t.domain}: <strong>{result.hostname}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.empty}>
                  <PolicyIcon name="info" />
                  <p role={busy ? "status" : undefined}>
                    {busy ? t.checkingDetails : t.empty}
                  </p>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={clear}
                  disabled={!url && !result}
                >
                  {t.other}
                </button>
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={busy}
                >
                  <PolicyIcon name={result ? "refresh" : "arrow"} />
                  {busy ? t.checking : result ? t.recheck : t.check}
                </button>
              </div>
            </form>

            <footer className={styles.rules}>
              <p>{t.rules}</p>
              <ul>
                <li>
                  <PolicyIcon name="block" />
                  {t.ownRule}
                </li>
                <li>
                  <PolicyIcon name="block" />
                  {t.shortenerRule}
                </li>
              </ul>
            </footer>
          </section>
          <p className={styles.tip}>
            <PolicyIcon name="info" />
            <span>{t.tip}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
