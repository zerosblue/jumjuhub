import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toBrandSlug } from "@/lib/utils";

const API_KEY = process.env.PUBLIC_DATA_API_KEY!;
const BASE_URL = "https://apis.data.go.kr/1130000/FftcBrandRlList";

async function fetchFranchiseData(serviceId: string, pageNo = 1, numOfRows = 100) {
  const url = new URL(`${BASE_URL}/${serviceId}`);
  url.searchParams.set("serviceKey", API_KEY);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));
  url.searchParams.set("resultType", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  try {
    const data = await fetchFranchiseData("getFftcBrandList");
    const items = data?.response?.body?.items?.item ?? [];

    let created = 0;
    let updated = 0;

    for (const item of items) {
      const name = item.cmpnm_nm ?? item.brand_nm ?? "";
      if (!name) continue;

      const slug = toBrandSlug(name);
      const brandData = {
        slug,
        name,
        category: item.induty_nm ?? "기타",
        storeCount: parseInt(item.fran_qty) || null,
        franchiseFee: item.fran_fee ? BigInt(Math.round(parseFloat(item.fran_fee) * 10000)) : null,
        deposit: item.security_deposit ? BigInt(Math.round(parseFloat(item.security_deposit) * 10000)) : null,
        dataUpdatedAt: new Date(),
      };

      const existing = await prisma.brand.findUnique({ where: { slug } });
      if (existing) {
        await prisma.brand.update({ where: { slug }, data: brandData });
        updated++;
      } else {
        await prisma.brand.create({ data: brandData });
        created++;
      }
    }

    return NextResponse.json({ ok: true, created, updated, total: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }

  const lastBrand = await prisma.brand.findFirst({
    orderBy: { dataUpdatedAt: "desc" },
    select: { dataUpdatedAt: true },
  });

  return NextResponse.json({
    lastSync: lastBrand?.dataUpdatedAt,
    brandCount: await prisma.brand.count(),
  });
}
