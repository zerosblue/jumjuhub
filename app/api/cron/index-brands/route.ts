import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requestIndexing, indexingConfigured, brandPageUrl } from "@/lib/google-indexing";
import { sendAdminEmail } from "@/lib/email";

export const maxDuration = 300;

// 구글 Indexing API 일일 할당량 200 중 크론이 190 사용 (신규 브랜드 즉시 요청분 여유분 10)
const DAILY_LIMIT = 190;

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const bearer = req.headers.get("authorization");
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!indexingConfigured()) {
    return NextResponse.json({ ok: false, skipped: "GOOGLE_SEARCH_CONSOLE_API_KEY 미설정" });
  }

  const brands = await prisma.brand.findMany({
    where: { isHidden: false },
    select: { id: true, slug: true, storeCount: true, dataUpdatedAt: true, indexRequestedAt: true },
  });

  // 대상: 한 번도 요청 안 했거나, 마지막 요청 이후 데이터가 갱신된 브랜드. 인기(가맹점 수) 순.
  const targets = brands
    .filter(
      (b) =>
        b.indexRequestedAt === null ||
        (b.dataUpdatedAt !== null && b.dataUpdatedAt > b.indexRequestedAt)
    )
    .sort((a, b) => (b.storeCount ?? 0) - (a.storeCount ?? 0))
    .slice(0, DAILY_LIMIT);

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, requested: 0, message: "색인 요청 대상 없음" });
  }

  const result = await requestIndexing(targets.map((t) => brandPageUrl(t.slug)));

  const okSlugs = new Set(result.ok.map((u) => decodeURIComponent(u.split("/brand/")[1])));
  const okIds = targets.filter((t) => okSlugs.has(t.slug)).map((t) => t.id);
  if (okIds.length > 0) {
    await prisma.brand.updateMany({
      where: { id: { in: okIds } },
      data: { indexRequestedAt: new Date() },
    });
  }

  const remaining = Math.max(0, brands.filter((b) => b.indexRequestedAt === null).length - result.ok.length);
  const emailSent = await sendAdminEmail(
    `[점주허브] 구글 색인 요청 완료 — 성공 ${result.ok.length}건`,
    [
      `구글 색인 자동 요청 결과 (${new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ")} KST)`,
      ``,
      `성공: ${result.ok.length}건`,
      `실패: ${result.failed.length}건${result.quotaExceeded ? " (일일 할당량 초과 포함)" : ""}`,
      `남은 미요청 브랜드: ${remaining}개`,
      ``,
      ...(result.failed.length > 0
        ? ["실패 상세 (최대 5건):", ...result.failed.slice(0, 5).map((f) => `- ${f.url}: ${f.error}`)]
        : []),
    ].join("\n")
  );

  return NextResponse.json({
    ok: true,
    requested: result.ok.length,
    failed: result.failed.length,
    quotaExceeded: result.quotaExceeded,
    remaining,
    emailSent,
    errors: result.failed.slice(0, 5),
  });
}
