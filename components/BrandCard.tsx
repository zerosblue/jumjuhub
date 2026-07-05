import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, MessageSquare, Store } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

interface BrandCardProps {
  brand: {
    slug: string;
    name: string;
    category: string;
    logoUrl?: string | null;
    storeCount: number | null;
    avgRevenue: string | null;
    franchiseFee: string | null;
    _count?: { posts: number };
  };
  rank?: number;
}

export default function BrandCard({ brand, rank }: BrandCardProps) {
  return (
    <Link
      href={`/brand/${encodeURIComponent(brand.slug)}`}
      className="group relative flex bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-green-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* 왼쪽 액센트 바 */}
      <div className="w-1 shrink-0 bg-green-800 opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-3 p-4 flex-1 min-w-0">
        {rank && (
          <span className={`text-lg font-black w-7 shrink-0 mt-0.5 ${rank <= 3 ? "text-amber-500" : "text-gray-300"}`}>
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <BrandLogo name={brand.name} logoUrl={brand.logoUrl} size="sm" />
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-100">
              {brand.category}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate text-[15px]">
            {brand.name}
          </h3>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Store size={11} />
              <span>{formatNumber(brand.storeCount)}개</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <TrendingUp size={11} />
              <span>{formatCurrency(brand.avgRevenue ? BigInt(brand.avgRevenue) : null)}</span>
            </div>
            {brand._count && (
              <div className="flex items-center gap-1 text-gray-400">
                <MessageSquare size={11} />
                <span>{brand._count.posts}개 글</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
