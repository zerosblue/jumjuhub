import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Store, TrendingUp, MessageSquare } from "lucide-react";

interface BrandCardProps {
  brand: {
    slug: string;
    name: string;
    category: string;
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
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        {rank && (
          <span className={`text-lg font-black w-7 shrink-0 ${rank <= 3 ? "text-amber-500" : "text-gray-300"}`}>
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {brand.category}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate">
            {brand.name}
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Store size={11} />
              <span>{formatNumber(brand.storeCount)}개</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 font-medium">
              <TrendingUp size={11} />
              <span>{formatCurrency(brand.avgRevenue ? BigInt(brand.avgRevenue) : null)}</span>
            </div>
            {brand._count && (
              <div className="flex items-center gap-1">
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
