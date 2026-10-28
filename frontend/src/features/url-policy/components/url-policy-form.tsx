"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { checkUrlPolicy, type UrlPolicyResult } from "../lib/check-url-policy";
import { PolicyIcon } from "./policy-icon";
import styles from "../url-policy.module.css";

const configuredDomains = (process.env.NEXT_PUBLIC_TOOLHUB_DOMAINS || "").split(
  ",",
);

export function UrlPolicyForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<UrlPolicyResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const blocked =
    result?.kind === "blocked-toolhub" || result?.kind === "blocked-shortener";
  const invalid = result?.kind === "invalid";
  const allowed = result?.kind === "allowed";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = checkUrlPolicy(url, [
      window.location.hostname,
      ...configuredDomains,
    ]);
    setResult(next);
    if (next.kind === "invalid") input.current?.focus();
    else requestAnimationFrame(() => status.current?.focus());
  }

  function clear() {
    setUrl("");
    setResult(null);
    input.current?.focus();
  }

  const title = invalid
    ? "Liên kết chưa hợp lệ"
    : blocked
      ? "Không thể sử dụng liên kết này"
      : "Chưa phát hiện tên miền bị chặn";
  const description =
    result?.kind === "blocked-toolhub"
      ? "Đây là liên kết trỏ về ToolHub. Hãy sử dụng trực tiếp link hiện có hoặc nhập URL gốc khác."
      : result?.kind === "blocked-shortener"
        ? "Đây là link từ một dịch vụ rút gọn khác. Hãy sao chép URL gốc của trang đích và nhập lại."
        : result?.kind === "invalid"
          ? result.message
          : "Liên kết vượt qua bước đối chiếu tên miền hiện tại. Hệ thống vẫn cần kiểm tra lại khi tạo link ngắn.";

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
              <p>Kiểm tra tên miền trước khi tiếp tục.</p>
            </div>
          </div>

          <form noValidate onSubmit={submit}>
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
                role={blocked || invalid ? "alert" : "status"}
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
                <p>
                  Dán liên kết bạn muốn sử dụng. ToolHub sẽ đối chiếu tên miền
                  và hiển thị kết quả tại đây.
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
              <button type="submit" className={styles.primary}>
                <PolicyIcon name={result ? "refresh" : "arrow"} />
                {result ? "Kiểm tra lại" : "Kiểm tra liên kết"}
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
