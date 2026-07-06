import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const maxDuration = 300;

const KEY = process.env.PUBLIC_DATA_API_KEY!;
const BASE = "https://apis.data.go.kr/1130000";
const LIST_URL = `${BASE}/FftcBrandRlsInfo2_Service/getBrandinfo`;
const ALOTM_URL = `${BASE}/FftcBrandFrcsAlotmInfo2_Service/getbrandFrcsbzmnAlotminfo`;
const INTRR_URL = `${BASE}/FftcBrandFrcsIntInfo2_Service/getbrandFrcsBzmnIntrrctinfo`;

async function fetchApi(baseUrl: string, yr: string, params: string, retries = 3): Promise<any> {
  const url = `${baseUrl}?serviceKey=${KEY}&resultType=json&jngBizCrtraYr=${yr}&${params}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
      const text = await res.text();
      if (text.trim() === "Forbidden") {
        throw new Error("API 접근 거부 — data.go.kr에서 해당 API 활용신청이 필요합니다.");
      }
      return JSON.parse(text);
    } catch (e: any) {
      if (e.message?.includes("접근 거부") || i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function detectLatestYear(): Promise<string> {
  for (const yr of ["2027", "2026", "2025"]) {
    const data = await fetchApi(LIST_URL, yr, "pageNo=1&numOfRows=1");
    if (Number(data.totalCount) > 0) return yr;
  }
  return "2025";
}

// "5200~5800" 같은 범위값(±5% 편차)의 중간값을 취해 천원 → 원 변환
function rangeToWon(v: unknown): bigint | null {
  const s = String(v ?? "").replace(/,/g, "").trim();
  if (!s) return null;
  let n: number;
  if (s.includes("~")) {
    const [a, b] = s.split("~").map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    n = (a + b) / 2;
  } else {
    n = Number(s);
  }
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

    // 1) 브랜드 목록에서 브랜드관리번호(brandMnno) 확보
    const first = await fetchApi(LIST_URL, yr, "pageNo=1&numOfRows=1");
    const totalCount = Number(first.totalCount) || 0;
    if (!totalCount) throw new Error(`${yr}년 브랜드 목록이 비어 있습니다.`);

    const apiBrands: Array<{ mnno: string; name: string }> = [];
    const totalPages = Math.ceil(totalCount / 1000);
    for (let page = 1; page <= totalPages; page++) {
      const data = await fetchApi(LIST_URL, yr, `pageNo=${page}&numOfRows=1000`);
      for (const it of data.items ?? []) {
        if (it.brandMnno && it.brandNm) apiBrands.push({ mnno: it.brandMnno, name: String(it.brandNm).trim() });
      }
    }

    // 2) DB 브랜드와 이름 매칭 (괄호 안/밖 별칭 포함) — 매칭된 브랜드만 조회해 호출 수 절약
    const dbBrands = await prisma.brand.findMany({ select: { id: true, name: true } });
    const aliasToId = new Map<string, string>();
    const ambiguous = new Set<string>();
    const register = (alias: string, id: string, exact: boolean) => {
      const key = alias.toLowerCase();
      if (!key) return;
      const cur = aliasToId.get(key);
      if (cur && cur !== id) {
        if (!exact) ambiguous.add(key);
        return;
      }
      aliasToId.set(key, id);
    };
    for (const b of dbBrands) register(b.name.trim(), b.id, true);
    for (const b of dbBrands) {
      const m = b.name.match(/^(.+?)\(([^)]+)\)\s*$/);
      if (!m) continue;
      for (const alias of [m[1].trim(), m[2].trim()]) {
        if (!aliasToId.has(alias.toLowerCase())) register(alias, b.id, false);
      }
    }
    for (const key of ambiguous) aliasToId.delete(key);

    const targets: Array<{ mnno: string; brandId: string }> = [];
    const seenBrandIds = new Set<string>();
    for (const ab of apiBrands) {
      const id = aliasToId.get(ab.name.toLowerCase());
      if (!id || seenBrandIds.has(id)) continue;
      seenBrandIds.add(id);
      targets.push({ mnno: ab.mnno, brandId: id });
    }

    // 3) 브랜드별 부담금 + 인테리어 조회 (동시 20)
    let updated = 0;
    let failed = 0;
    const CONC = 20;
    for (let i = 0; i < targets.length; i += CONC) {
      await Promise.all(
        targets.slice(i, i + CONC).map(async (t) => {
          try {
            const [alot, intr] = await Promise.all([
              fetchApi(ALOTM_URL, yr, `pageNo=1&numOfRows=5&brandMnno=${t.mnno}`),
              fetchApi(INTRR_URL, yr, `pageNo=1&numOfRows=5&brandMnno=${t.mnno}`),
            ]);
            const a = alot?.items?.[0] ?? {};
            const it = intr?.items?.[0] ?? {};
            const area = Number(it.storCrtraAr);
            const data = {
              franchiseFee: rangeToWon(a.jngAmtScopeVal),
              deposit: rangeToWon(a.assrncAmtScopeVal),
              educationFee: rangeToWon(a.eduAmtScopeVal),
              interiorCost: rangeToWon(it.intrrAmtScopeVal),
              interiorUnitCost: rangeToWon(it.unitArIntrrAmtScopeVal),
              standardArea: Number.isFinite(area) && area > 0 ? area : null,
            };
            if (Object.values(data).every((v) => v === null)) return;
            await prisma.brand.update({ where: { id: t.brandId }, data });
            updated++;
          } catch {
            failed++;
          }
        })
      );
    }

    return NextResponse.json({ ok: true, yr, apiBrands: apiBrands.length, matched: targets.length, updated, failed });
  } catch (err: any) {
    console.error("[franchise-cost-sync] 오류:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
