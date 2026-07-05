import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BrandCard from "@/components/BrandCard";
import SearchBar from "@/components/SearchBar";

const CATEGORIES = ["치킨", "커피", "한식", "분식", "피자", "제과제빵", "일식", "중식", "패스트푸드", "주점", "이미용", "교육 (외국어)"];

async function getBrands(q: string, category: string, page: number) {
  const where: any = {
    storeCount: { gt: 0 },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
    // 검색 시에는 데이터 없는 브랜드도 포함
    delete where.storeCount;
  }
  if (category) {
    where.subcategory = { contains: category, mode: "insensitive" };
  }

  const limit = 24;
  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: { storeCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        logoUrl: true,
        storeCount: true,
        avgRevenue: true,
        franchiseFee: true,
        deposit: true,
        dataUpdatedAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    brands: brands.map((b) => ({
      ...b,
      avgRevenue: b.avgRevenue?.toString() ?? null,
      franchiseFee: b.franchiseFee?.toString() ?? null,
      deposit: b.deposit?.toString() ?? null,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function BrandPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = sp.category ?? "";
  const page = parseInt(sp.page ?? "1");

  const { brands, total, totalPages } = await getBrands(q, category, page);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900 mb-4">브랜드 탐색</h1>
          <SearchBar defaultValue={q} />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap mb-6">
          <a
            href="/brand"
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !category
                ? "bg-green-800 text-white border-green-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
            }`}
          >
            전체
          </a>
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/brand?${q ? `q=${encodeURIComponent(q)}&` : ""}category=${encodeURIComponent(cat)}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === cat
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {q || category
            ? `"${q || category}" 검색 결과 ${total.toLocaleString()}개`
            : `전체 ${total.toLocaleString()}개 브랜드`}
        </p>

        {brands.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">검색 결과가 없습니다.</p>
            <p className="text-sm mt-1">다른 검색어를 시도해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/brand?${q ? `q=${encodeURIComponent(q)}&` : ""}${category ? `category=${encodeURIComponent(category)}&` : ""}page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
                  p === page
                    ? "bg-green-800 text-white border-green-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
