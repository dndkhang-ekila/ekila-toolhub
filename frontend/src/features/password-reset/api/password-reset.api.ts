import {
  PasswordResetError,
  type PasswordResetErrorCode,
} from "../types/password-reset.types";

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

function retryAfterSeconds(value: string | null): number {
  if (!value) return 0;
  const seconds = /^\d+$/.test(value)
    ? Number(value)
    : (Date.parse(value) - Date.now()) / 1000;
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0;
}

async function post(
  path: string,
  body: Record<string, string>,
  expectedStatus: number,
  signal?: AbortSignal,
): Promise<Response> {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(15000);
    response = await fetch(`${apiUrl}/auth/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new PasswordResetError("NETWORK_ERROR");
  }

  if (response.status === expectedStatus) return response;

  const retryAfter = retryAfterSeconds(response.headers.get("Retry-After"));
  if (response.status === 429) {
    throw new PasswordResetError("RATE_LIMITED", retryAfter);
  }

  let code: PasswordResetErrorCode = "SERVICE_UNAVAILABLE";
  if (response.status === 400 || response.status === 422) {
    const data: unknown = await response.json().catch(() => null);
    if (data && typeof data === "object" && "error" in data) {
      const error = data.error;
      if (error && typeof error === "object" && "code" in error) {
        const candidate = error.code;
        if (
          candidate === "INVALID_EMAIL" ||
          candidate === "RESET_LINK_INVALID" ||
          candidate === "PASSWORD_POLICY_VIOLATION"
        ) {
          code = candidate;
        }
      }
    }
  }
  throw new PasswordResetError(code);
}

export async function requestPasswordReset(email: string): Promise<number> {
  const response = await post("forgot-password", { email }, 202);
  return retryAfterSeconds(response.headers.get("Retry-After"));
}

export async function validateResetToken(
  token: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await post(
    "reset-password/validate",
    { token },
    200,
    signal,
  );
  const data: unknown = await response.json().catch(() => null);
  if (
    !data ||
    typeof data !== "object" ||
    !("valid" in data) ||
    data.valid !== true
  ) {
    throw new PasswordResetError("SERVICE_UNAVAILABLE");
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await post("reset-password", { token, newPassword }, 204);
}
