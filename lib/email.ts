// Resend 무료 계정: 도메인 미인증 상태에선 계정 소유자 이메일로만 발송 가능
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kjm798nz@naver.com";

async function trySend(key: string, from: string, subject: string, text: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [ADMIN_EMAIL], subject, text }),
  });
  return res.ok;
}

export async function sendAdminEmail(subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    if (process.env.EMAIL_FROM && (await trySend(key, process.env.EMAIL_FROM, subject, text))) {
      return true;
    }
    return await trySend(key, "점주허브 <onboarding@resend.dev>", subject, text);
  } catch {
    return false;
  }
}
