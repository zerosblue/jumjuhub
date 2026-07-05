import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import BrandCard from "@/components/BrandCard";
import PostCard from "@/components/PostCard";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import { formatDate } from "@/lib/utils";

const CATEGORIES = [
  { name: "치킨", icon: "🍗", slug: "치킨" },
  { name: "커피", icon: "☕", slug: "커피" },
  { name: "편의점", icon: "🏪", slug: "편의점" },
  { name: "분식", icon: "🍜", slug: "분식" },
  { name: "피자", icon: "🍕", slug: "피자" },
  { name: "한식", icon: "🍱", slug: "한식" },
  { name: "버거", icon: "🍔", slug: "버거" },
  { name: "디저트", icon: "🧁", slug: "디저트" },
];

async function getHomeData() {
  try {
    const [topBrands, recentPosts, lastSync] = await Promise.all([
      prisma.brand.findMany({
        orderBy: { storeCount: "desc" },
        take: 10,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          storeCount: true,
          avgRevenue: true,
          franchiseFee: true,
          deposit: true,
          dataUpdatedAt: true,
          _count: { select: { posts: true } },
        },
      }),
      prisma.post.findMany({
        where: { isBlinded: false },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: {
          author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
          brand: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.brand.findFirst({
        orderBy: { dataUpdatedAt: "desc" },
        select: { dataUpdatedAt: true },
      }),
    ]);

    return {
      topBrands: topBrands.map((b) => ({
        ...b,
        avgRevenue: b.avgRevenue?.toString() ?? null,
        franchiseFee: b.franchiseFee?.toString() ?? null,
        deposit: b.deposit?.toString() ?? null,
      })),
      recentPosts: recentPosts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        author: p.isAnonymous ? null : p.author,
      })),
      lastSync: lastSync?.dataUpdatedAt,
    };
  } catch {
    return { topBrands: [], recentPosts: [], lastSync: null };
  }
}

export default async function HomePage() {
  const { topBrands, recentPosts, lastSync } = await getHomeData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 히어로 */}
      <section className="bg-green-800 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-green-200 text-sm font-medium mb-2">11,000개+ 브랜드 · 공정위 공식 데이터</p>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            진짜 점주들의 솔직한 이야기
          </h1>
          <p className="text-green-100 text-sm mb-6">
            가맹비부터 평균매출까지, 창업 전에 꼭 알아야 할 정보
          </p>
          <SearchBar placeholder="브랜드명을 검색하세요 (예: BBQ, 메가커피, CU)" size="lg" />
          {lastSync && (
            <p className="text-green-300 text-xs mt-3">
              공정위 데이터 기준: {formatDate(lastSync)}
            </p>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AdSensePlaceholder format="horizontal" className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: TOP 10 + 카테고리 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 업종별 빠른 탐색 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-3">업종별 탐색</h2>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/brand?category=${encodeURIComponent(cat.slug)}`}
                    className="bg-white rounded-xl border border-gray-100 p-3 text-center hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="text-xs font-medium text-gray-700 mt-1">{cat.name}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 인기 브랜드 TOP 10 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">🏆 인기 브랜드 TOP 10</h2>
                <Link href="/brand" className="text-xs text-green-700 hover:underline">
                  전체 보기
                </Link>
              </div>
              {topBrands.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  <p>브랜드 데이터를 불러오는 중입니다.</p>
                  <p className="text-xs mt-1">공정위 API 동기화 후 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topBrands.map((brand, i) => (
                    <BrandCard key={brand.id} brand={brand} rank={i + 1} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 오른쪽: 최근 인기글 */}
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">🔥 커뮤니티 인기글</h2>
                <Link href="/community" className="text-xs text-green-700 hover:underline">
                  더 보기
                </Link>
              </div>
              {recentPosts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
                  아직 게시글이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <PostCard key={post.id} post={post as any} />
                  ))}
                </div>
              )}
            </section>

            {/* 퀵 액션 */}
            <section className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">빠른 메뉴</h3>
              <div className="space-y-2">
                {[
                  { href: "/community/write?board=QNA", label: "❓ 창업 질문하기" },
                  { href: "/community/write?board=REPORT_ABUSE", label: "😤 갑질 제보하기" },
                  { href: "/community/write?board=REVIEW", label: "⭐ 점주 후기 남기기" },
                  { href: "/community/write?board=TRADE", label: "🛒 점포 양도하기" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-sm text-gray-700 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <AdSensePlaceholder format="rectangle" />
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-600">점주허브 JumjuHub</p>
          <p>© 2026 점주허브. All rights reserved.</p>
          <p>본 사이트의 공정위 데이터는 data.go.kr에서 제공하는 공공데이터를 활용합니다.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-600">개인정보처리방침</Link>
            <a href="mailto:admin@jumjuhub.com" className="hover:text-gray-600">문의하기</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
