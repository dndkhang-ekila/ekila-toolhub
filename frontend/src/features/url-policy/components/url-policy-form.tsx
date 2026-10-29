"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { checkUrlPolicy } from "../lib/check-url-policy";
import {
  checkUrlOnServer,
  type ServerUrlPolicyResult,
} from "../api/check-url.api";
import { PolicyIcon } from "./policy-icon";
import styles from "../url-policy.module.css";

export function UrlPolicyForm() {
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
    ? "Liên kết chưa hợp lệ"
    : blocked
      ? "Không thể sử dụng liên kết này"
      : result?.kind === "rate-limited"
        ? "Vui lòng chờ trước khi thử lại"
        : result?.kind === "unverified"
          ? "Chưa thể xác minh liên kết"
          : "Chưa phát hiện tên miền bị chặn";
  const description =
    result?.kind === "blocked-toolhub"
      ? "Đây là liên kết trỏ về ToolHub. Hãy sử dụng trực tiếp link hiện có hoặc nhập URL gốc khác."
      : result?.kind === "blocked-shortener"
        ? "Đây là link từ một dịch vụ rút gọn khác. Hãy sao chép URL gốc của trang đích và nhập lại."
        : result && "message" in result
          ? result.message
          : "Máy chủ đã kiểm tra tên miền và chuyển hướng. Khi tạo link vẫn cần kiểm tra lại; kết quả không xác nhận nội dung an toàn.";

  return (
    <main className={styles.shell}>
      <div className={styles.content}>
        <header className={styles.intro}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="ToolHub — Trang chủ"
          >
            Tool<span>Hub.</span>
          </Link>
          <p className={styles.eyebrow}>KIỂM TRA LIÊN KẾT</p>
          <h1>Kiểm tra trước khi rút gọn</h1>
          <p className={styles.subtitle}>
            Sử dụng liên kết gốc để tránh chuyển hướng nhiều lần.
          </p>
        </header>

        <section className={styles.panel} aria-labelledby="url-policy-title">
          <div className={styles.panelHeading}>
            <span className={styles.iconTile}>
              <PolicyIcon name="link" />
            </span>
            <div>
              <h2 id="url-policy-title">Liên kết cần kiểm tra</h2>
              <p>Kiểm tra tên miền và chuyển hướng trước khi tiếp tục.</p>
            </div>
          </div>

          <form noValidate onSubmit={submit} aria-busy={busy}>
            <label htmlFor="original-url" className={styles.label}>
              Nhập URL gốc
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
                  aria-label="Xóa liên kết"
                >
                  <PolicyIcon name="close" />
                </button>
              )}
            </div>
            <p id="url-help" className={styles.helper}>
              Chỉ hỗ trợ http:// hoặc https:// · Tối đa 2.048 ký tự
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
                      Tên miền: <strong>{result.hostname}</strong>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                <PolicyIcon name="info" />
                <p role={busy ? "status" : undefined}>
                  {busy
                    ? "Đang kiểm tra tên miền và chuyển hướng…"
                    : "Dán liên kết bạn muốn sử dụng. ToolHub sẽ kiểm tra tại máy chủ và hiển thị kết quả tại đây."}
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
                Nhập link khác
              </button>
              <button type="submit" className={styles.primary} disabled={busy}>
                <PolicyIcon name={result ? "refresh" : "arrow"} />
                {busy
                  ? "Đang kiểm tra…"
                  : result
                    ? "Kiểm tra lại"
                    : "Kiểm tra liên kết"}
              </button>
            </div>
          </form>

          <footer className={styles.rules}>
            <p>Những liên kết nào bị chặn?</p>
            <ul>
              <li>
                <PolicyIcon name="block" />
                Link trỏ về ToolHub
              </li>
              <li>
                <PolicyIcon name="block" />
                Link từ dịch vụ rút gọn khác
              </li>
            </ul>
          </footer>
        </section>
        <p className={styles.tip}>
          <PolicyIcon name="info" />
          <span>Bạn đã có link ngắn? Hãy sử dụng trực tiếp link đó.</span>
        </p>
      </div>
    </main>
  );
}
