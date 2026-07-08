import crypto from "crypto";

// GOOGLE_SEARCH_CONSOLE_API_KEY = 구글 서비스 계정 JSON(그대로 또는 base64).
// Indexing API는 API 키 인증을 지원하지 않아 서비스 계정 JWT가 필요하다.
type ServiceAccount = { client_email: string; private_key: string };

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json);
    if (sa.client_email && sa.private_key) return sa as ServiceAccount;
  } catch {}
  return null;
}

export function indexingConfigured(): boolean {
  return loadServiceAccount() !== null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  const jwt = `${unsigned}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`구글 토큰 발급 실패: ${data.error_description ?? data.error ?? res.status}`);
  }
  return data.access_token;
}

export type IndexingResult = {
  ok: string[];
  failed: { url: string; error: string }[];
  quotaExceeded: boolean;
};

export async function requestIndexing(urls: string[]): Promise<IndexingResult> {
  const result: IndexingResult = { ok: [], failed: [], quotaExceeded: false };
  const sa = loadServiceAccount();
  if (!sa || urls.length === 0) return result;

  const token = await getAccessToken(sa);

  for (const url of urls) {
    try {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
      });
      if (res.ok) {
        result.ok.push(url);
      } else if (res.status === 429) {
        result.quotaExceeded = true;
        result.failed.push({ url, error: "일일 할당량(200개) 초과" });
        break;
      } else {
        const body = await res.json().catch(() => ({}));
        result.failed.push({ url, error: body?.error?.message ?? `HTTP ${res.status}` });
      }
    } catch (e: any) {
      result.failed.push({ url, error: e.message ?? "요청 실패" });
    }
  }

  return result;
}

export function brandPageUrl(slug: string): string {
  return `https://jumjuhub.com/brand/${encodeURIComponent(slug)}`;
}
