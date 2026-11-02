import type { UrlPolicyResult } from "../lib/check-url-policy";

export type ServerUrlPolicyResult =
  | UrlPolicyResult
  | {
      kind:
        "blocked-redirect" | "blocked-target" | "unverified" | "rate-limited";
      message: string;
    };

const unavailable: ServerUrlPolicyResult = {
  kind: "unverified",
  message: "Chưa thể xác minh liên kết. Vui lòng kiểm tra kết nối và thử lại.",
};

export async function checkUrlOnServer(
  url: string,
  signal: AbortSignal,
): Promise<ServerUrlPolicyResult> {
  try {
    const base = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
    ).replace(/\/+$/, "");
    const response = await fetch(`${base}/url-policy/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: url.trim() }),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
    if (response.status === 429) {
      const raw = response.headers.get("Retry-After");
      const seconds =
        raw && /^\d+$/.test(raw) ? Math.min(Number(raw), 3600) : 60;
      return {
        kind: "rate-limited",
        message: `Bạn đã kiểm tra quá nhiều lần. Vui lòng thử lại sau ${seconds} giây.`,
      };
    }
    const data: unknown = await response.json().catch(() => null);
    if (!data || typeof data !== "object") return unavailable;
    if (response.status === 200) {
      if (
        "allowed" in data &&
        data.allowed === true &&
        "hostname" in data &&
        typeof data.hostname === "string" &&
        data.hostname &&
        "normalizedUrl" in data &&
        typeof data.normalizedUrl === "string" &&
        "policyVersion" in data &&
        typeof data.policyVersion === "string" &&
        "redirectsChecked" in data &&
        Number.isInteger(data.redirectsChecked) &&
        "finalHostname" in data &&
        typeof data.finalHostname === "string"
      )
        return { kind: "allowed", hostname: data.hostname };
      return unavailable;
    }
    if (![400, 422].includes(response.status) || !("error" in data))
      return unavailable;
    const error = data.error;
    if (!error || typeof error !== "object" || !("code" in error))
      return unavailable;
    const hostname = new URL(url.trim()).hostname
      .toLowerCase()
      .replace(/\.+$/, "");
    switch (error.code) {
      case "SELF_DOMAIN_NOT_ALLOWED":
        return { kind: "blocked-toolhub", hostname };
      case "SHORTENER_DOMAIN_NOT_ALLOWED":
        return { kind: "blocked-shortener", hostname };
      case "INVALID_URL":
        return {
          kind: "invalid",
          message:
            "Liên kết không hợp lệ. Vui lòng nhập URL http:// hoặc https:// tối đa 2.048 ký tự.",
        };
      case "REDIRECT_TARGET_NOT_ALLOWED":
        return {
          kind: "blocked-redirect",
          message:
            "Liên kết chuyển hướng đến tên miền hoặc địa chỉ không được phép. Hãy nhập URL gốc khác.",
        };
      case "REDIRECT_LOOP":
      case "TOO_MANY_REDIRECTS":
        return {
          kind: "blocked-redirect",
          message:
            "Liên kết có vòng lặp hoặc quá nhiều bước chuyển hướng. Hãy nhập trực tiếp URL đích.",
        };
      case "UNSAFE_URL_TARGET":
        return {
          kind: "blocked-target",
          message:
            "Không hỗ trợ địa chỉ mạng nội bộ hoặc cổng truy cập này. Hãy nhập liên kết công khai.",
        };
      default:
        return unavailable;
    }
  } catch (error) {
    if (signal.aborted) throw error;
    return unavailable;
  }
}
