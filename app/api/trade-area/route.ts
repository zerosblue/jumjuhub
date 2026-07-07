import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUpjong } from "@/lib/trade-area";

const KEY = process.env.PUBLIC_DATA_API_KEY!;
const RADIUS_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius";

const ALLOWED_RADIUS = new Set([500, 1000, 2000, 4000]);

async function fetchStores(
  cx: number,
  cy: number,
  radius: number,
  filter: { indsLclsCd?: string; indsMclsCd?: string; indsSclsCd?: string }
) {
  const upjongParam = filter.indsSclsCd
    ? `&indsSclsCd=${filter.indsSclsCd}`
    : filter.indsMclsCd
      ? `&indsMclsCd=${filter.indsMclsCd}`
      : filter.indsLclsCd
        ? `&indsLclsCd=${filter.indsLclsCd}`
        : "";

  const stores: any[] = [];
  const numOfRows = 1000;
  for (let page = 1; page <= 5; page++) {
    const url = `${RADIUS_URL}?serviceKey=${KEY}&pageNo=${page}&numOfRows=${numOfRows}&radius=${radius}&cx=${cx}&cy=${cy}${upjongParam}&type=json`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    if (text.trim() === "Forbidden") {
      throw new Error("상가정보 API 활용신청 승인이 필요합니다.");
    }
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`상가정보 API 응답 오류: ${text.slice(0, 120)}`);
    }
    const items = data?.body?.items ?? [];
    stores.push(...items);
    const totalCount = Number(data?.body?.totalCount) || 0;
    if (page * numOfRows >= totalCount) break;
  }
  return stores;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const brandSlug = sp.get("brand") ?? "";
  const cx = Number(sp.get("cx"));
  const cy = Number(sp.get("cy"));
  const radius = Number(sp.get("radius") ?? 1000);

  // 한국 좌표 범위 검증
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || cx < 124 || cx > 132 || cy < 33 || cy > 39) {
    return NextResponse.json({ error: "좌표가 올바르지 않습니다." }, { status: 400 });
  }
  if (!ALLOWED_RADIUS.has(radius)) {
    return NextResponse.json({ error: "반경은 500/1000/2000/4000m만 가능합니다." }, { status: 400 });
  }

  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    select: { name: true, category: true, subcategory: true },
  });
  if (!brand) {
    return NextResponse.json({ error: "브랜드를 찾을 수 없습니다." }, { status: 404 });
  }

  const filter = resolveUpjong(brand.subcategory, brand.category, brand.name);
  if (!filter) {
    return NextResponse.json(
      { error: `"${brand.subcategory ?? brand.category}" 업종은 아직 상권분석을 지원하지 않습니다.` },
      { status: 422 }
    );
  }

  try {
    const raw = await fetchStores(cx, cy, radius, filter);

    // 같은 브랜드 판별: 괄호 안/밖 이름 별칭 포함
    const aliases = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    aliases.add(norm(brand.name));
    const m = brand.name.match(/^(.+?)\(([^)]+)\)\s*$/);
    if (m) {
      aliases.add(norm(m[1]));
      aliases.add(norm(m[2]));
    }
    const isSameBrand = (bizesNm: string) => {
      const n = norm(bizesNm);
      for (const a of aliases) {
        if (a.length >= 2 && n.includes(a)) return true;
      }
      return false;
    };

    const stores = raw
      .filter((s) => s.bizesNm && Number.isFinite(Number(s.lon)) && Number.isFinite(Number(s.lat)))
      .map((s) => ({
        name: String(s.bizesNm),
        branch: s.brchNm ? String(s.brchNm) : null,
        lon: Number(s.lon),
        lat: Number(s.lat),
        addr: String(s.rdnmAdr || s.lnoAdr || ""),
        upjong: String(s.indsSclsNm || s.indsMclsNm || ""),
        same: isSameBrand(String(s.bizesNm)),
      }));

    const sameCount = stores.filter((s) => s.same).length;

    // 경쟁 브랜드 TOP 5: DB의 동일 업종 브랜드명과 상호명 매칭으로 집계
    // (상가정보 상호에는 지점명이 붙어 있어 상호명 단순 그룹핑으로는 브랜드가 안 잡힘)
    const GENERIC = new Set(["치킨", "통닭", "피자", "버거", "카페", "커피", "분식", "김밥", "주점", "호프", "한식", "편의점"]);
    // 업종이 브랜드명으로 보정된 경우(토스트 등) 경쟁 후보도 같은 키워드로 선정
    const TOAST_KW = /토스트|샌드위치|샐러드/;
    const dbBrands = await prisma.brand.findMany({
      where: TOAST_KW.test(brand.name)
        ? { OR: [{ name: { contains: "토스트" } }, { name: { contains: "샌드위치" } }, { name: { contains: "샐러드" } }] }
        : brand.subcategory
          ? { subcategory: brand.subcategory }
          : { category: brand.category },
      select: { name: true },
    });
    const brandAliases: Array<{ display: string; aliases: string[] }> = [];
    for (const b of dbBrands) {
      if (b.name === brand.name) continue;
      const as = new Set<string>([norm(b.name)]);
      const bm = b.name.match(/^(.+?)\(([^)]+)\)\s*$/);
      if (bm) {
        as.add(norm(bm[1]));
        as.add(norm(bm[2]));
      }
      const valid = [...as].filter((a) => a.length >= 2 && !GENERIC.has(a));
      if (valid.length) brandAliases.push({ display: b.name, aliases: valid });
    }
    const counter = new Map<string, number>();
    for (const s of stores) {
      if (s.same) continue;
      const n = norm(s.name);
      const hit = brandAliases.find((b) => b.aliases.some((a) => n.includes(a)));
      if (hit) counter.set(hit.display, (counter.get(hit.display) ?? 0) + 1);
    }
    const topBrands = [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 밀집도: 반경 면적(km²)당 점포 수
    const areaKm2 = Math.PI * Math.pow(radius / 1000, 2);
    const densityPerKm2 = stores.length / areaKm2;
    const density = densityPerKm2 >= 30 ? "높음" : densityPerKm2 >= 10 ? "보통" : "낮음";

    return NextResponse.json({
      ok: true,
      upjongLabel: filter.label,
      total: stores.length,
      sameCount,
      density,
      densityPerKm2: Math.round(densityPerKm2 * 10) / 10,
      topBrands,
      stores,
    });
  } catch (err: any) {
    console.error("[trade-area] 오류:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
