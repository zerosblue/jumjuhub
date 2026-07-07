import Link from "next/link";
import { Info, Map } from "lucide-react";

export default function BrandTabs({ slug, active }: { slug: string; active: "info" | "trade" }) {
  const base = "flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors";
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex">
        <Link
          href={`/brand/${slug}`}
          className={`${base} ${active === "info" ? "text-green-800 border-green-800" : "text-gray-500 border-transparent hover:text-gray-800"}`}
        >
          <Info size={15} /> 브랜드 정보
        </Link>
        <Link
          href={`/brand/${slug}/trade-area`}
          className={`${base} ${active === "trade" ? "text-green-800 border-green-800" : "text-gray-500 border-transparent hover:text-gray-800"}`}
        >
          <Map size={15} /> 상권 분석
        </Link>
      </div>
    </nav>
  );
}
