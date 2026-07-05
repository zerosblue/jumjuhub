"use client";

import { useState } from "react";
import { Store } from "lucide-react";

// 주요 한국 프랜차이즈 공식 도메인 매핑
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
  "처갓집": "cheogajip.co.kr",
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
  "다이소": "daiso.co.kr",
};

function googleFavicon(domain: string): string {
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
}

function getLogoSrc(name: string, logoUrl?: string | null): string | null {
  // 1. DB에 저장된 로고 (관리자가 직접 지정한 경우)
  if (logoUrl && !logoUrl.includes("clearbit")) return logoUrl;

  // 2. 매핑 테이블 → Google 파비콘
  const domain = DOMAIN_MAP[name.trim()];
  if (domain) return googleFavicon(domain);

  // 3. 영문명 브랜드 → 추출 후 Google 파비콘 시도
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  const en = paren ? paren[1] : /^[A-Za-z0-9 &'.\-]+$/.test(name) ? name : null;
  if (en) {
    const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) return googleFavicon(`${slug}.co.kr`);
  }

  return null;
}

interface BrandLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: { box: "w-5 h-5", text: "text-xs", icon: 12 },
  md: { box: "w-8 h-8", text: "text-sm", icon: 16 },
  lg: { box: "w-16 h-16", text: "text-2xl", icon: 28 },
};

export default function BrandLogo({ name, logoUrl, size = "md", className = "" }: BrandLogoProps) {
  const src = getLogoSrc(name, logoUrl);
  const [failed, setFailed] = useState(false);
  const s = SIZE[size];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`${s.box} rounded-lg object-contain border border-gray-100 bg-white shrink-0 ${className}`}
      />
    );
  }

  if (size === "lg") {
    return (
      <div className={`${s.box} rounded-xl bg-green-50 flex items-center justify-center shrink-0 ${className}`}>
        <Store size={s.icon} className="text-green-600" />
      </div>
    );
  }

  return (
    <div className={`${s.box} rounded bg-green-800 flex items-center justify-center text-white font-black shrink-0 ${className}`}>
      <span className={s.text}>{name[0]}</span>
    </div>
  );
}
