import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BrandCard from "@/components/BrandCard";
import SearchBar from "@/components/SearchBar";
import { Search } from "lucide-react";

const CATEGORIES = [
  "치킨", "커피", "한식", "분식", "피자", "제과제빵",
  "일식", "중식", "서양식", "패스트푸드", "주점",
  "편의점", "이미용", "교육 (외국어)", "아이스크림/빙수",
];

type SortKey = "storeCount" | "avgRevenue" | "name";

async function getBrands(q: string, category: string, page: number, sort: SortKey) {
  const where: any = { storeCount: { gt: 0 } };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
    delete where.storeCount;
  }
  if (category) {
    where.subcategory = { contains: category, mode: "insensitive" };
  }

  const orderBy =
    sort === "name"
      ? { name: "asc" as const }
      : sort === "avgRevenue"
      ? { avgRevenue: "desc" as const }
      : { storeCount: "desc" as const };

  const limit = 24;
  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy,
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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "storeCount", label: "가맹점 수" },
  { key: "avgRevenue", label: "평균 매출" },
  { key: "name", label: "가나다순" },
];

export default async function BrandPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = sp.category ?? "";
  const page = parseInt(sp.page ?? "1");
  const sort: SortKey = (sp.sort as SortKey) ?? "storeCount";

  const { brands, total, totalPages } = await getBrands(q, category, page, sort);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 히어로 배너 */}
      <section className="bg-green-800 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-green-300 text-xs font-medium mb-1">공정위 공식 데이터 기반</p>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">브랜드 탐색</h1>
          <p className="text-green-200 text-sm mb-5">
            {total.toLocaleString()}개 브랜드의 가맹점 수, 평균 매출, 창업비용을 비교하세요
          </p>
          <SearchBar defaultValue={q} size="lg" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* 카테고리 필터 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">업종별 필터</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/brand"
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                !category
                  ? "bg-green-800 text-white border-green-800 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-800"
              }`}
            >
              전체
            </a>
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/brand?${q ? `q=${encodeURIComponent(q)}&` : ""}category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  category === cat
                    ? "bg-green-800 text-white border-green-800 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-800"
                }`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>

        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {(q || category) && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                <Search size={11} />
                {q || category}
              </span>
            )}
            <p className="text-sm text-gray-500">
              {q || category
                ? `검색 결과 ${total.toLocaleString()}개`
                : `전체 ${total.toLocaleString()}개 브랜드`}
            </p>
          </div>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <a
                key={opt.key}
                href={`/brand?${q ? `q=${encodeURIComponent(q)}&` : ""}${category ? `category=${encodeURIComponent(category)}&` : ""}sort=${opt.key}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  sort === opt.key
                    ? "bg-green-800 text-white border-green-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">검색 결과가 없습니다.</p>
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
                href={`/brand?${q ? `q=${encodeURIComponent(q)}&` : ""}${category ? `category=${encodeURIComponent(category)}&` : ""}${sort !== "storeCount" ? `sort=${sort}&` : ""}page=${p}`}
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
