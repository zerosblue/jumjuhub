"use client";

import { useState } from "react";
import { Store } from "lucide-react";

// 주요 한국 프랜차이즈 도메인 매핑
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
  "푸라닭": "puradak.com",
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
  "노브랜드버거": "nobrand-burger.com",
  "파리바게뜨": "paris.co.kr",
  "뚜레쥬르": "tlj.co.kr",
  "던킨": "dunkindonuts.co.kr",
  "배스킨라빈스": "baskinrobbins.co.kr",
  "요거트월드": "yogurtworld.co.kr",
  "한솥": "hansot.com",
  "본도시락": "bon.co.kr",
  "김밥천국": "gimbabheaven.com",
  "교동짬뽕": "gyodong.kr",
  "홍콩반점": "hhbnj.com",
  "명인만두": "myunginsatay.com",
  "새마을식당": "saemaul.com",
  "한촌설렁탕": "seolleongtang.co.kr",
  "이랜드잇": "elandeat.com",
  "아웃백": "outback.co.kr",
  "TGIF": "tgifridays.co.kr",
  "빕스": "vips.co.kr",
  "애슐리": "ashley.co.kr",
  "다이소": "daiso.co.kr",
  "올리브영": "oliveyoung.co.kr",
  "아성다이소": "daiso.co.kr",
};

function getClearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

function getLogoChain(name: string, logoUrl?: string | null): string[] {
  const urls: string[] = [];

  // 1. DB에 저장된 로고
  if (logoUrl) urls.push(logoUrl);

  // 2. 매핑 테이블
  const mapped = DOMAIN_MAP[name.trim()];
  if (mapped) urls.push(getClearbitUrl(mapped));

  // 3. 영문명 추출 후 Clearbit 시도
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  const en = paren ? paren[1] : /^[A-Za-z0-9 &'.\-]+$/.test(name) ? name : null;
  if (en) {
    const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) {
      urls.push(`https://logo.clearbit.com/${slug}.co.kr`);
      urls.push(`https://logo.clearbit.com/${slug}.com`);
    }
  }

  // 중복 제거
  return [...new Set(urls)];
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
  const chain = getLogoChain(name, logoUrl);
  const [idx, setIdx] = useState(0);
  const s = SIZE[size];

  const src = chain[idx] ?? null;

  const handleError = () => {
    if (idx + 1 < chain.length) {
      setIdx(idx + 1);
    } else {
      setIdx(chain.length); // 모두 실패 → null
    }
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={handleError}
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
