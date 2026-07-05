import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// BrandLogo 컴포넌트와 동일한 도메인 매핑
const DOMAIN_MAP: Record<string, string> = {
  "CU": "cu.bgfretail.com",
  "GS25": "gs25.gsretail.com",
  "GS THE FRESH": "gsthefresh.gsretail.com",
  "세븐일레븐": "7-eleven.co.kr",
  "이마트24": "emart24.co.kr",
  "미니스톱": "ministop.co.kr",
  "BBQ": "bbq.co.kr",
  "BHC": "bhcchicken.com",
  "교촌치킨": "kyochon.com",
  "네네치킨": "nene.co.kr",
  "굽네치킨": "goobne.com",
  "메가커피": "mega-coffee.co.kr",
  "컴포즈커피": "composecoffee.com",
  "빽다방": "paik.co.kr",
  "이디야커피": "ediya.com",
  "스타벅스": "starbucks.co.kr",
  "투썸플레이스": "twosome.co.kr",
  "할리스": "hollys.co.kr",
  "엔제리너스": "angelinus.com",
  "파스쿠찌": "pascucci.co.kr",
  "롯데리아": "lotteria.com",
  "맥도날드": "mcdonalds.com",
  "버거킹": "burgerking.com",
  "KFC": "kfc.co.kr",
  "서브웨이": "subway.com",
  "맘스터치": "momstouch.co.kr",
  "파리바게뜨": "paris.co.kr",
  "뚜레쥬르": "tlj.co.kr",
  "던킨": "dunkindonuts.co.kr",
  "배스킨라빈스": "baskinrobbins.co.kr",
  "한솥": "hansot.com",
  "새마을식당": "saemaul.com",
  "아웃백": "outback.co.kr",
  "빕스": "vips.co.kr",
  "올리브영": "oliveyoung.co.kr",
};

function getCandidateUrls(name: string): string[] {
  const urls: string[] = [];

  // 1. 매핑 테이블
  const mapped = DOMAIN_MAP[name.trim()];
  if (mapped) urls.push(`https://logo.clearbit.com/${mapped}`);

  // 2. 영문명 추출 후 Clearbit 시도
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  const en = paren ? paren[1] : /^[A-Za-z0-9 &'.\-]+$/.test(name) ? name : null;
  if (en) {
    const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) {
      urls.push(`https://logo.clearbit.com/${slug}.co.kr`);
      urls.push(`https://logo.clearbit.com/${slug}.com`);
    }
  }

  return [...new Set(urls)];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 실행 가능합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const limit: number = body.limit ?? 500;

  const brands = await prisma.brand.findMany({
    where: { logoUrl: null },
    select: { id: true, name: true },
    take: limit,
  });

  let updated = 0;
  let skipped = 0;

  // 후보 URL이 있으면 첫 번째 URL을 그냥 저장 (클라이언트 onError가 폴백 처리)
  await Promise.all(
    brands.map(async (brand) => {
      const candidates = getCandidateUrls(brand.name);
      if (candidates.length === 0) { skipped++; return; }
      await prisma.brand.update({
        where: { id: brand.id },
        data: { logoUrl: candidates[0] },
      });
      updated++;
    })
  );

  return NextResponse.json({ total: brands.length, updated, skipped });
}
