import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import { formatCurrency, formatNumber, formatDate, boardTypeLabel } from "@/lib/utils";
import { Store, Calendar, FileText, TrendingUp, DollarSign, Info } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const BOARD_TYPES = [
  { type: "NOTICE" },
  { type: "QNA" },
  { type: "REVIEW" },
  { type: "FREE" },
  { type: "REPORT_ABUSE" },
  { type: "TRADE" },
] as const;

async function getBrandData(slug: string) {
  return prisma.brand.findUnique({
    where: { slug },
    include: {
      storeHistory: { orderBy: { year: "asc" }, take: 5 },
      _count: { select: { posts: true, subscriptions: true } },
    },
  });
}

async function getBrandPosts(brandId: string, boardType?: string) {
  return prisma.post.findMany({
    where: { brandId, isBlinded: false, ...(boardType ? { boardType: boardType as any } : {}) },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 20,
    include: {
      author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
      brand: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { name: true, category: true, avgRevenue: true, franchiseFee: true },
  });
  if (!brand) return {};

  return {
    title: `${brand.name} 점주 후기 · 창업정보`,
    description: `${brand.name} 실제 가맹점주 후기, 평균 매출 ${brand.avgRevenue ? formatCurrency(brand.avgRevenue) : "정보없음"}, 가맹비 ${brand.franchiseFee ? formatCurrency(brand.franchiseFee) : "정보없음"}. 진짜 점주들의 솔직한 이야기.`,
  };
}

function StoreHistoryChart({ history }: { history: { year: number; totalCount: number; newCount: number; closedCount: number }[] }) {
  if (!history.length) return null;
  const maxBar = Math.max(...history.flatMap((h) => [h.newCount, h.closedCount]), 1);
  const BAR_H = 80;

  return (
    <div>
      {/* 총 가맹점 수 추이 */}
      <div className="flex items-center w-full mb-4 overflow-x-auto">
        {history.map((h, i) => {
          const prev = history[i - 1];
          const diff = prev ? h.totalCount - prev.totalCount : 0;
          return (
            <div key={h.year} className="flex-1 text-center">
              <p className="text-xs font-bold text-gray-800">{h.totalCount.toLocaleString()}개</p>
              {diff !== 0 && (
                <p className={`text-xs font-medium ${diff > 0 ? "text-green-600" : "text-red-500"}`}>
                  {diff > 0 ? "▲" : "▼"}{Math.abs(diff).toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">{h.year}년</p>
            </div>
          );
        })}
      </div>

      {/* 신규/폐점 바 차트 */}
      <div className="flex items-end w-full">
        {history.map((h) => (
          <div key={h.year} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-1" style={{ height: `${BAR_H}px` }}>
              <div className="flex flex-col justify-end items-center" style={{ width: 14 }}>
                <span className="text-xs text-green-700 font-bold mb-0.5" style={{ fontSize: 10 }}>{h.newCount}</span>
                <div
                  className="bg-green-500 rounded-t"
                  style={{ width: 14, height: `${(h.newCount / maxBar) * (BAR_H - 20)}px`, minHeight: h.newCount ? 4 : 0 }}
                />
              </div>
              <div className="flex flex-col justify-end items-center" style={{ width: 14 }}>
                <span className="text-xs text-red-500 font-bold mb-0.5" style={{ fontSize: 10 }}>{h.closedCount}</span>
                <div
                  className="bg-red-400 rounded-t"
                  style={{ width: 14, height: `${(h.closedCount / maxBar) * (BAR_H - 20)}px`, minHeight: h.closedCount ? 4 : 0 }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">{h.year}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-green-500" />신규 개점</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-400" />폐점</span>
      </div>
    </div>
  );
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ board?: string; page?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { board } = await searchParams;
  const slug = decodeURIComponent(rawSlug);

  const brand = await getBrandData(slug);
  if (!brand) notFound();

  const posts = await getBrandPosts(brand.id, board);

  const costItems = [
    { label: "가맹비", value: brand.franchiseFee },
    { label: "보증금", value: brand.deposit },
    { label: "인테리어", value: brand.interiorCost },
    { label: "교육비", value: brand.educationFee },
  ].filter((i) => i.value !== null);

  const totalCost = costItems.reduce((acc, i) => acc + Number(i.value ?? 0), 0);
  const latestHistory = brand.storeHistory[brand.storeHistory.length - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <AdSensePlaceholder format="horizontal" />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── 브랜드 헤더 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start gap-4">
            <BrandLogo name={brand.name} logoUrl={brand.logoUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{brand.category}</span>
                {brand.subcategory && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{brand.subcategory}</span>
                )}
              </div>
              <h1 className="text-2xl font-black text-gray-900">{brand.name}</h1>
              {brand.dataUpdatedAt && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info size={11} />
                  {new Date(brand.dataUpdatedAt).getFullYear()}년 공정위 정보공개서 기준
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 핵심 지표 카드 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Store size={16} className="text-gray-400 mx-auto mb-1.5" />
            <p className="text-xs text-gray-500 mb-1">가맹점 수</p>
            <p className="text-lg font-black text-gray-900">
              {brand.storeCount != null ? `${formatNumber(brand.storeCount)}개` : "-"}
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
            <TrendingUp size={16} className="text-amber-500 mx-auto mb-1.5" />
            <p className="text-xs text-amber-600 mb-1">연 평균매출</p>
            <p className="text-lg font-black text-amber-600">
              {brand.avgRevenue ? formatCurrency(brand.avgRevenue) : "-"}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
            <Calendar size={16} className="text-green-600 mx-auto mb-1.5" />
            <p className="text-xs text-green-700 mb-1">신규 개점</p>
            <p className="text-lg font-black text-green-700">
              {latestHistory ? `+${latestHistory.newCount}개` : "-"}
            </p>
            {latestHistory && <p className="text-xs text-gray-400">{latestHistory.year}년</p>}
          </div>

          <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
            <FileText size={16} className="text-red-400 mx-auto mb-1.5" />
            <p className="text-xs text-red-500 mb-1">폐점</p>
            <p className="text-lg font-black text-red-500">
              {latestHistory ? `-${latestHistory.closedCount}개` : "-"}
            </p>
            {latestHistory && <p className="text-xs text-gray-400">{latestHistory.year}년</p>}
          </div>
        </div>

        {/* ── 연도별 가맹점 현황 차트 ── */}
        {brand.storeHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              연도별 가맹점 현황
            </h2>
            <StoreHistoryChart history={brand.storeHistory} />
          </div>
        )}

        {/* ── 창업 비용 상세 ── */}
        {costItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              창업 비용 상세
            </h2>
            <div className="space-y-2">
              {costItems.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</span>
                </div>
              ))}
              {totalCost > 0 && (
                <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-200 mt-1">
                  <span className="text-sm font-bold text-gray-800">총 창업비용 (합산)</span>
                  <span className="text-base font-black text-green-800">{formatCurrency(totalCost)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 계약 조건 ── */}
        {(brand.adFee !== null || brand.royaltyFee !== null || brand.contractPeriod !== null || brand.directStoreCount !== null) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-green-600" />
              계약 조건
            </h2>
            <div className="space-y-2">
              {brand.contractPeriod !== null && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">계약 기간</span>
                  <span className="text-sm font-bold text-gray-900">{brand.contractPeriod}년</span>
                </div>
              )}
              {brand.adFee !== null && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">광고분담금</span>
                  <span className="text-sm font-bold text-gray-900">{brand.adFee}%</span>
                </div>
              )}
              {brand.royaltyFee !== null && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">로열티</span>
                  <span className="text-sm font-bold text-gray-900">{brand.royaltyFee}%</span>
                </div>
              )}
              {brand.directStoreCount !== null && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">직영점 수</span>
                  <span className="text-sm font-bold text-gray-900">{formatNumber(brand.directStoreCount)}개</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 브랜드 전용 커뮤니티 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{brand.name} 게시판</h2>
            <Link
              href={`/community/write?brandId=${brand.id}&board=${board || "FREE"}`}
              className="bg-green-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
            >
              글 작성
            </Link>
          </div>

          {/* 게시판 탭 */}
          <div className="flex overflow-x-auto border-b border-gray-100">
            <Link
              href={`/brand/${slug}`}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                !board ? "border-green-800 text-green-800" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              전체
            </Link>
            {BOARD_TYPES.map(({ type }) => {
              const { label, icon } = boardTypeLabel(type);
              return (
                <Link
                  key={type}
                  href={`/brand/${slug}?board=${type}`}
                  className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    board === type ? "border-green-800 text-green-800" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {icon} {label}
                </Link>
              );
            })}
          </div>

          {/* 게시글 목록 */}
          <div className="divide-y divide-gray-50">
            {posts.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">
                아직 게시글이 없습니다. 첫 글을 작성해보세요!
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{ ...post, createdAt: post.createdAt.toISOString(), author: post.isAnonymous ? null : post.author }}
                />
              ))
            )}
          </div>

          {posts.length === 20 && (
            <div className="p-4 text-center border-t border-gray-50">
              <Link
                href={`/brand/${slug}?board=${board || ""}&page=2`}
                className="text-sm text-green-700 hover:underline font-medium"
              >
                게시글 더 보기 →
              </Link>
            </div>
          )}
        </div>

        <AdSensePlaceholder format="horizontal" />
      </main>
    </div>
  );
}
