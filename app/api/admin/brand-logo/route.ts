import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 브랜드명에서 영문 부분 추출: "씨유(CU)" → "CU", "GS25" → "GS25", "메가커피" → null
function extractEnglishPart(name: string): string | null {
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  if (paren) return paren[1].trim();
  if (/^[A-Za-z0-9 &'.\-]+$/.test(name)) return name.trim();
  return null;
}

async function tryClearbit(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://logo.clearbit.com/${domain}`, {
      signal: AbortSignal.timeout(4000),
    });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const limit: number = body.limit ?? 200;

  // logoUrl 없는 브랜드만 처리
  const brands = await prisma.brand.findMany({
    where: { logoUrl: null },
    select: { id: true, name: true },
    take: limit,
  });

  let updated = 0;
  let skipped = 0;

  for (const brand of brands) {
    const en = extractEnglishPart(brand.name);
    if (!en) { skipped++; continue; }

    const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
    const candidates = [`${slug}.co.kr`, `${slug}.com`];

    let logoUrl: string | null = null;
    for (const domain of candidates) {
      if (await tryClearbit(domain)) {
        logoUrl = `https://logo.clearbit.com/${domain}`;
        break;
      }
    }

    if (logoUrl) {
      await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl } });
      updated++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ total: brands.length, updated, skipped });
}
