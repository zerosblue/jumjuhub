import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toBrandSlug } from "@/lib/utils";

const KEY = process.env.PUBLIC_DATA_API_KEY!;

async function fetchStatsPage(yr: string, pageNo: number, numOfRows = 1000) {
  const url = `https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService/getBrandFrcsStats?serviceKey=${KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json&yr=${yr}`;
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API 응답 파싱 실패: ${text.slice(0, 200)}`);
  }
}

async function detectLatestYear(): Promise<string> {
  for (const yr of ["2026", "2025", "2024", "2023"]) {
    const data = await fetchStatsPage(yr, 1, 1);
    if (data.totalCount > 0) return yr;
  }
  return "2023";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const requestedYr: string | null = body.yr ?? null;

  try {
    const yr = requestedYr ?? await detectLatestYear();

    // 전체 건수 파악
    const first = await fetchStatsPage(yr, 1, 1);
    const totalCount: number = first.totalCount ?? 0;
    if (!totalCount) throw new Error("API에서 데이터를 가져오지 못했습니다.");

    const numOfRows = 1000;
    const totalPages = Math.ceil(totalCount / numOfRows);
    const allItems: any[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const data = await fetchStatsPage(yr, page, numOfRows);
      allItems.push(...(data.items ?? []));
    }

    // slug 중복 방지: 먼저 기존 DB slug 로드 후 순차적으로 slug 할당
    const existingBrands = await prisma.brand.findMany({ select: { slug: true, name: true } });
    const slugSet = new Set(existingBrands.map((b) => b.slug));
    const nameToSlug = new Map(existingBrands.map((b) => [b.name, b.slug]));

    // 순차적으로 slug 생성 (병렬 처리 시 중복 발생 방지)
    const prepared: Array<{
      slug: string;
      name: string;
      category: string;
      subcategory: string | null;
      storeCount: number;
      newCount: number;
      closedCount: number;
      avgRevenue: bigint | null;
    }> = [];

    for (const item of allItems) {
      const name: string = item.brandNm ?? "";
      if (!name) continue;

      const corpNm: string = item.corpNm ?? "";

      // 이미 처리한 동명 브랜드는 skip (같은 연도 내 중복 brandNm 존재 가능)
      if (nameToSlug.has(name)) {
        // 기존 항목 업데이트를 위해 slug 재사용
        prepared.push({
          slug: nameToSlug.get(name)!,
          name,
          category: item.indutyLclasNm ?? "기타",
          subcategory: item.indutyMlsfcNm ?? null,
          storeCount: parseInt(item.frcsCnt) || 0,
          newCount: parseInt(item.newFrcsRgsCnt) || 0,
          closedCount: (parseInt(item.ctrtEndCnt) || 0) + (parseInt(item.ctrtCncltnCnt) || 0),
          avgRevenue: item.avrgSlsAmt ? BigInt(Math.round(Number(item.avrgSlsAmt) * 1000)) : null,
        });
        continue;
      }

      // 신규 slug 생성
      let slug = toBrandSlug(name) || "brand";
      if (slugSet.has(slug)) {
        const corpSlug = toBrandSlug(corpNm).slice(0, 10);
        slug = corpSlug ? `${slug}-${corpSlug}` : slug;
        let i = 2;
        const base = slug;
        while (slugSet.has(slug)) slug = `${base}-${i++}`;
      }
      slugSet.add(slug);
      nameToSlug.set(name, slug);

      prepared.push({
        slug,
        name,
        category: item.indutyLclasNm ?? "기타",
        subcategory: item.indutyMlsfcNm ?? null,
        storeCount: parseInt(item.frcsCnt) || 0,
        newCount: parseInt(item.newFrcsRgsCnt) || 0,
        closedCount: parseInt(item.ctrtEndCnt) || 0,
        avgRevenue: item.avrgSlsAmt ? BigInt(Math.round(Number(item.avrgSlsAmt) * 1000)) : null,
      });
    }

    let created = 0;
    let updated = 0;

    // 100개씩 병렬 upsert (slug는 이미 고유함)
    const BATCH = 100;
    for (let i = 0; i < prepared.length; i += BATCH) {
      const batch = prepared.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (item) => {
          const { newCount, closedCount, ...brandData } = item;
          const result = await prisma.brand.upsert({
            where: { slug: item.slug },
            create: { ...brandData, dataUpdatedAt: new Date() },
            update: { ...brandData, dataUpdatedAt: new Date() },
          });

          if (result.storeCount || newCount || closedCount) {
            await prisma.brandStoreHistory.upsert({
              where: { brandId_year: { brandId: result.id, year: parseInt(yr) } },
              create: { brandId: result.id, year: parseInt(yr), newCount, closedCount, totalCount: item.storeCount },
              update: { newCount, closedCount, totalCount: item.storeCount },
            });
          }

          // upsert가 create였는지 update였는지 판별
          const wasExisting = existingBrands.some((b) => b.slug === item.slug);
          if (wasExisting) updated++;
          else created++;
        })
      );
    }

    return NextResponse.json({ ok: true, created, updated, total: prepared.length, yr });
  } catch (err: any) {
    console.error("[franchise-sync] 오류:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }

  return NextResponse.json({
    lastSync: (await prisma.brand.findFirst({ orderBy: { dataUpdatedAt: "desc" }, select: { dataUpdatedAt: true } }))?.dataUpdatedAt,
    brandCount: await prisma.brand.count(),
  });
}
