import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 한글(영문) 패턴에서 영문 추출: "씨유(CU)" → "CU"
function extractEnglishName(name: string): string | null {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun: boolean = body.dryRun ?? true;

  // 한글(영문) 패턴 브랜드 전체 조회
  const parentheticals = await prisma.brand.findMany({
    where: { name: { contains: "(" } },
    include: { storeHistory: true },
  });

  const results: Array<{ from: string; to: string; status: string }> = [];

  for (const src of parentheticals) {
    const enName = extractEnglishName(src.name);
    if (!enName) continue;

    // 영문명과 일치하는 브랜드 찾기
    const target = await prisma.brand.findFirst({
      where: { name: enName, id: { not: src.id } },
      include: { storeHistory: true },
    });

    if (!target) {
      results.push({ from: src.name, to: enName, status: "no_target" });
      continue;
    }

    if (dryRun) {
      results.push({ from: src.name, to: target.name, status: "dry_run" });
      continue;
    }

    // storeHistory 병합: target에 없는 연도만 이전
    const targetYears = new Set(target.storeHistory.map((h) => h.year));
    for (const h of src.storeHistory) {
      if (!targetYears.has(h.year)) {
        await prisma.brandStoreHistory.create({
          data: {
            brandId: target.id,
            year: h.year,
            newCount: h.newCount,
            closedCount: h.closedCount,
            totalCount: h.totalCount,
          },
        });
      }
    }

    // 게시글 재연결
    await prisma.post.updateMany({
      where: { brandId: src.id },
      data: { brandId: target.id },
    });

    // 구독 재연결 (중복 제거)
    const subs = await prisma.brandSubscription.findMany({ where: { brandId: src.id } });
    for (const sub of subs) {
      const exists = await prisma.brandSubscription.findFirst({
        where: { userId: sub.userId, brandId: target.id },
      });
      if (!exists) {
        await prisma.brandSubscription.create({
          data: { userId: sub.userId, brandId: target.id },
        });
      }
    }

    // 원본 삭제
    await prisma.brand.delete({ where: { id: src.id } });

    results.push({ from: src.name, to: target.name, status: "merged" });
  }

  return NextResponse.json({ dryRun, total: parentheticals.length, results });
}
