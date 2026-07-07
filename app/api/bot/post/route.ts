import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BOT_EMAIL = "bot@jumjuhub.com";

const FOOTER = `

---
📋 이 글은 공정위 공개 데이터를 기반으로
점주허브봇이 자동 생성한 정보성 글입니다.
실제 점주님의 후기와 의견을 댓글로 남겨주세요! 👇
---`;

const bodySchema = z.object({
  brandName: z.string().min(1).max(100),
  title: z.string().min(2).max(200),
  content: z.string().min(5).max(10000),
  boardType: z
    .enum(["NOTICE", "QNA", "REVIEW", "FREE", "REPORT_ABUSE", "TRADE", "REVENUE", "LEGAL", "CLOSURE"])
    .default("FREE"),
});

// Rate limit: 분당 10회 (인스턴스 단위 인메모리)
const RATE_LIMIT = 10;
const rateWindow = { minute: 0, count: 0 };

function checkRateLimit(): boolean {
  const nowMinute = Math.floor(Date.now() / 60_000);
  if (rateWindow.minute !== nowMinute) {
    rateWindow.minute = nowMinute;
    rateWindow.count = 0;
  }
  rateWindow.count++;
  return rateWindow.count <= RATE_LIMIT;
}

function isValidApiKey(key: string | null): boolean {
  const expected = process.env.BOT_API_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isValidApiKey(req.headers.get("x-bot-api-key"))) {
    return NextResponse.json({ success: false, error: "인증에 실패했습니다." }, { status: 401 });
  }
  if (!checkRateLimit()) {
    return NextResponse.json(
      { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (분당 10회 제한)" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 JSON 형식입니다." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const firstMsg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "입력값을 확인해 주세요.";
    return NextResponse.json({ success: false, error: firstMsg }, { status: 400 });
  }
  const { brandName, title, content, boardType } = parsed.data;

  // 브랜드 매칭: slug → 이름 정확일치 → 이름 부분일치 (괄호 별칭 포함 표기 대응)
  const brand =
    (await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: brandName.toLowerCase().trim() },
          { name: { equals: brandName.trim(), mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, name: true },
    })) ??
    (await prisma.brand.findFirst({
      where: { name: { contains: brandName.trim(), mode: "insensitive" } },
      select: { id: true, slug: true, name: true },
    }));

  if (!brand) {
    return NextResponse.json(
      { success: false, error: `브랜드를 찾을 수 없습니다: "${brandName}"` },
      { status: 404 }
    );
  }

  const bot = await prisma.user.findUnique({ where: { email: BOT_EMAIL }, select: { id: true, isBanned: true } });
  if (!bot || bot.isBanned) {
    return NextResponse.json({ success: false, error: "봇 계정을 사용할 수 없습니다." }, { status: 503 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      content: content + FOOTER,
      authorId: bot.id,
      brandId: brand.id,
      boardType,
    },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    postId: post.id,
    brandSlug: brand.slug,
    url: `https://jumjuhub.com/brand/${brand.slug}`,
  });
}
