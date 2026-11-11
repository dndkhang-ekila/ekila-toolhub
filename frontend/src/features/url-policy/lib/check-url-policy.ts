export type UrlPolicyResult =
  | { kind: "invalid"; message: string }
  | {
      kind: "blocked-toolhub" | "blocked-shortener" | "allowed";
      hostname: string;
    };

export const DEFAULT_SHORTENER_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "cutt.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "shorturl.at",
] as const;

function normalizedDomain(domain: string): string | null {
  try {
    const input = domain.trim();
    if (!input) return null;
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return url.hostname.toLowerCase().replace(/\.+$/, "");
  } catch {
    return null;
  }
}

function matchesDomain(hostname: string, domains: readonly string[]): boolean {
  return domains.some((domain) => {
    const candidate = normalizedDomain(domain);
    return (
      candidate &&
      (hostname === candidate || hostname.endsWith(`.${candidate}`))
    );
  });
}

export function checkUrlPolicy(
  input: string,
  toolhubDomains: readonly string[],
  shortenerDomains: readonly string[] = DEFAULT_SHORTENER_DOMAINS,
): UrlPolicyResult {
  const value = input.trim();
  if (!value)
    return { kind: "invalid", message: "Vui lòng nhập liên kết cần kiểm tra." };
  if (value.length > 2048)
    return {
      kind: "invalid",
      message: "Liên kết không được vượt quá 2.048 ký tự.",
    };
  if (/[\u0000-\u0020\u007f\\]/.test(value))
    return {
      kind: "invalid",
      message: "Liên kết chứa khoảng trắng hoặc ký tự không hợp lệ.",
    };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {
      kind: "invalid",
      message: "Vui lòng nhập URL đầy đủ, bắt đầu bằng http:// hoặc https://.",
    };
  }
  if (!["http:", "https:"].includes(url.protocol))
    return {
      kind: "invalid",
      message: "Chỉ hỗ trợ liên kết http:// hoặc https://.",
    };
  if (url.username || url.password)
    return {
      kind: "invalid",
      message: "Không sử dụng liên kết chứa thông tin đăng nhập.",
    };
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  if (!hostname)
    return { kind: "invalid", message: "Liên kết chưa có tên miền hợp lệ." };
  if (matchesDomain(hostname, toolhubDomains))
    return { kind: "blocked-toolhub", hostname };
  if (matchesDomain(hostname, shortenerDomains))
    return { kind: "blocked-shortener", hostname };
  return { kind: "allowed", hostname };
}
