import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const KEY = process.env.PUBLIC_DATA_API_KEY!;

const ALOTM_URL = "https://apis.data.go.kr/1130000/FftcBrandFrcsAlotmInfo2_Service/getbrandFrcsbzmnAlotminfo";
const INTRR_URL = "https://apis.data.go.kr/1130000/FftcBrandFrcsIntInfo2_Service/getbrandFrcsBzmnIntrrctinfo";

async function fetchPage(baseUrl: string, yr: string, pageNo: number, numOfRows = 1000) {
  const url = `${baseUrl}?serviceKey=${KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json&jngBizCrtraYr=${yr}`;
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (text.trim() === "Forbidden") {
    throw new Error("API 접근 거부 — data.go.kr에서 해당 API 활용신청이 필요합니다.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API 응답 파싱 실패: ${text.slice(0, 200)}`);
  }
}

async function fetchAll(baseUrl: string, yr: string): Promise<any[]> {
  const first = await fetchPage(baseUrl, yr, 1, 1);
  const totalCount: number = Number(first.totalCount) || 0;
  if (!totalCount) return [];

  const numOfRows = 1000;
  const totalPages = Math.ceil(totalCount / numOfRows);
  const items: any[] = [];
  for (let page = 1; page <= totalPages; page++) {
    const data = await fetchPage(baseUrl, yr, page, numOfRows);
    items.push(...(data.items ?? []));
  }
  return items;
}

async function detectLatestYear(): Promise<string> {
  for (const yr of ["2026", "2025", "2024", "2023"]) {
    const data = await fetchPage(ALOTM_URL, yr, 1, 1);
    if (Number(data.totalCount) > 0) return yr;
  }
  return "2023";
}

// 공정위 금액 필드는 천원 단위 → 원 단위로 변환
function toWon(v: unknown): bigint | null {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 1000)) : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const yr: string = body.yr ?? (await detectLatestYear());

    const [alotmItems, intrrItems] = await Promise.all([
      fetchAll(ALOTM_URL, yr),
      fetchAll(INTRR_URL, yr).catch(() => [] as any[]),
    ]);

    type Costs = {
      franchiseFee: bigint | null;
      deposit: bigint | null;
      educationFee: bigint | null;
      interiorCost: bigint | null;
    };
    const costMap = new Map<string, Costs>();

    for (const item of alotmItems) {
      const name = String(item.brandNm ?? "").trim();
      if (!name) continue;
      costMap.set(name, {
        franchiseFee: toWon(item.jngAmtScopeVal),
        deposit: toWon(item.assrncAmtScopeVal),
        educationFee: toWon(item.eduAmtScopeVal),
        interiorCost: costMap.get(name)?.interiorCost ?? null,
      });
    }

    for (const item of intrrItems) {
      const name = String(item.brandNm ?? "").trim();
      if (!name) continue;
      const existing = costMap.get(name);
      const interiorCost = toWon(item.intrrAmtScopeVal);
      if (existing) existing.interiorCost = interiorCost;
      else costMap.set(name, { franchiseFee: null, deposit: null, educationFee: null, interiorCost });
    }

    const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
    const updates: Array<{ id: string; costs: Costs }> = [];
    for (const b of brands) {
      const costs = costMap.get(b.name.trim());
      if (!costs) continue;
      if (!costs.franchiseFee && !costs.deposit && !costs.educationFee && !costs.interiorCost) continue;
      updates.push({ id: b.id, costs });
    }

    const BATCH = 100;
    for (let i = 0; i < updates.length; i += BATCH) {
      await Promise.all(
        updates.slice(i, i + BATCH).map((u) =>
          prisma.brand.update({ where: { id: u.id }, data: u.costs })
        )
      );
    }

    return NextResponse.json({
      ok: true,
      yr,
      apiRecords: alotmItems.length,
      interiorRecords: intrrItems.length,
      updated: updates.length,
    });
  } catch (err: any) {
    console.error("[franchise-cost-sync] 오류:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
