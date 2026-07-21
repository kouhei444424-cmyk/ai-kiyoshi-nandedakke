export const ARTICLE_PATH_PATTERN = /^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;
export const MAX_NICKNAME_LENGTH = 20;
export const MAX_BODY_LENGTH = 400;
export const DEFAULT_NICKNAME = "名無しのオレ";
export const RATE_LIMIT_MIN_INTERVAL_MS = 60 * 1000;
export const RATE_LIMIT_HOURLY_WINDOW_MS = 60 * 60 * 1000;
export const RATE_LIMIT_HOURLY_MAX = 8;
export const MAX_REQUEST_BYTES = 8 * 1024;
export const PUBLIC_PAGE_SIZE = 20;
export const MAX_PUBLIC_PAGE_SIZE = 20;
export const MAX_ADMIN_PAGE_SIZE = 100;

function isControlCodePoint(codePoint) {
  if (codePoint === 0x09 || codePoint === 0x0a) {
    return false;
  }
  return (
    (codePoint >= 0x00 && codePoint <= 0x1f) ||
    codePoint === 0x7f
  );
}

const URL_LIKE_PATTERN =
  /https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}|\b[a-z0-9-]+\.[a-z]{2,}\/\S*/i;

export function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function normalizeArticlePath(value) {
  if (typeof value !== "string") {
    return null;
  }

  const path = value.trim();

  return ARTICLE_PATH_PATTERN.test(path) ? path : null;
}

export function codePointLength(value) {
  return Array.from(value).length;
}

export function sanitizePlainText(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\r\n?/g, "\n");
  const stripped = Array.from(normalized)
    .filter((char) => !isControlCodePoint(char.codePointAt(0)))
    .join("");

  return stripped.trim();
}

export function containsUrl(value) {
  return URL_LIKE_PATTERN.test(value);
}

export function isSameOrigin(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");

  if (origin && origin !== requestUrl.origin) {
    return false;
  }

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }

  return true;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSubmitter(request, salt) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  return sha256Hex(`${salt}:${ip}`);
}

export async function verifyTurnstile(secret, token, request) {
  if (!token || typeof token !== "string") {
    return { success: false, reason: "missing-token" };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);

  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) {
    formData.append("remoteip", ip);
  }

  let response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData },
    );
  } catch {
    return { success: false, reason: "network-error" };
  }

  if (!response.ok) {
    return { success: false, reason: "verify-http-error" };
  }

  const result = await response.json();
  return { success: Boolean(result.success), reason: result["error-codes"]?.[0] };
}

async function constantTimeEqual(a, b) {
  const [hashA, hashB] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let mismatch = 0;
  for (let i = 0; i < hashA.length; i += 1) {
    mismatch |= hashA.charCodeAt(i) ^ hashB.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function checkAdminAuth(request, env) {
  const expected = env.COMMENT_ADMIN_TOKEN;

  if (!expected) {
    return false;
  }

  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);

  if (!match) {
    return false;
  }

  return constantTimeEqual(match[1], expected);
}

export function readNickname(value) {
  const cleaned = sanitizePlainText(value ?? "").replace(/\n/g, " ");
  if (cleaned.length === 0) {
    return DEFAULT_NICKNAME;
  }
  return cleaned;
}

export function serializeComment(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    body: row.body,
    createdAt: row.created_at,
  };
}
