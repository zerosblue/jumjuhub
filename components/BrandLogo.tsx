"use client";

import { useState } from "react";
import { Store } from "lucide-react";

function guessLogoUrl(name: string, logoUrl?: string | null): string | null {
  if (logoUrl) return logoUrl;
  // 영문명 추출: "씨유(CU)" → "cu", "GS25" → "gs25"
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  const en = paren ? paren[1] : /^[A-Za-z0-9 &'.\-]+$/.test(name) ? name : null;
  if (!en) return null;
  const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `https://logo.clearbit.com/${slug}.co.kr`;
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
  const initial = guessLogoUrl(name, logoUrl);
  const [src, setSrc] = useState<string | null>(initial);
  const [failed, setFailed] = useState(false);
  const s = SIZE[size];

  const handleError = () => {
    if (!failed && src && src.includes(".co.kr")) {
      // .co.kr 실패 → .com 시도
      setSrc(src.replace(".co.kr", ".com"));
      setFailed(true);
    } else {
      setSrc(null);
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
