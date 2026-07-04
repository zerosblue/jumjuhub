import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import { formatCurrency, formatNumber, formatDate, boardTypeLabel } from "@/lib/utils";
import { Store, Calendar, TrendingUp, FileText } from "lucide-react";

const BOARD_TYPES = [
  { type: "NOTICE", requireVerify: false },
  { type: "QNA", requireVerify: false },
  { type: "REVIEW", requireVerify: true },
  { type: "FREE", requireVerify: false },
  { type: "REPORT_ABUSE", requireVerify: false },
  { type: "TRADE", requireVerify: false },
] as const;

async function getBrandData(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      storeHistory: { orderBy: { year: "asc" } },
      _count: { select: { posts: true, subscriptions: true } },
    },
  });
  return brand;
}

async function getBrandPosts(brandId: string, boardType?: string) {
  return prisma.post.findMany({
    where: { brandId, isBlinded: false, ...(boardType ? { boardType: boardType as any } : {}) },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 10,
    include: {
      author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
      brand: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { name: true, category: true, avgRevenue: true, franchiseFee: true },
  });
  if (!brand) return {};

  const avgRevStr = brand.avgRevenue ? formatCurrency(brand.avgRevenue) : "정보 없음";
  const feeStr = brand.franchiseFee ? formatCurrency(brand.franchiseFee) : "정보 없음";

  return {
    title: `${brand.name} 점주 후기`,
    description: `${brand.name} 실제 가맹점주 후기, 평균 매출 ${avgRevStr}, 창업비용 가맹비 ${feeStr}. 진짜 점주들의 솔직한 이야기를 확인하세요.`,
    keywords: [
      `${brand.name} 창업`,
      `${brand.name} 점주 후기`,
      `${brand.name} 가맹비`,
      `${brand.name} 평균매출`,
    ],
    openGraph: {
      title: `${brand.name} 점주 후기 | 점주허브`,
      description: `${brand.name} 가맹점주 커뮤니티 — 실제 후기와 창업 비용 정보`,
    },
  };
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ board?: string }>;
}) {
  const { slug } = await params;
  const { board } = await searchParams;

  const brand = await getBrandData(slug);
  if (!brand) notFound();

  const posts = await getBrandPosts(brand.id, board);

  const costItems = [
    { label: "가맹비", value: brand.franchiseFee },
    { label: "보증금", value: brand.deposit },
    { label: "인테리어", value: brand.interiorCost },
    { label: "교육비", value: brand.educationFee },
  ].filter((i) => i.value !== null);

  const totalCost = costItems.reduce((acc, i) => acc + (i.value ? Number(i.value) : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 상단 AdSense */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <AdSensePlaceholder format="horizontal" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 브랜드 정보 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 브랜드 기본 정보 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="mb-4">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {brand.category}
                </span>
                <h1 className="text-2xl font-black text-gray-900 mt-2">{brand.name}</h1>
                {brand.dataUpdatedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    데이터 기준: {formatDate(brand.dataUpdatedAt)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-600 font-medium mb-1">평균 연매출</p>
                  <p className="text-xl font-black text-amber-600">
                    {formatCurrency(brand.avgRevenue)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">가맹점 수</p>
                  <p className="text-xl font-black text-gray-800">
                    {formatNumber(brand.storeCount)}개
                  </p>
                </div>
              </div>

              {/* 창업비용 */}
              {costItems.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">창업 비용</p>
                  <div className="space-y-1.5">
                    {costItems.map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                    {totalCost > 0 && (
                      <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5 mt-1.5">
                        <span className="font-bold text-gray-700">총 창업비용</span>
                        <span className="font-black text-green-800">{formatCurrency(totalCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 기타 정보 */}
              <div className="mt-4 space-y-2 text-sm">
                {brand.contractPeriod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar size={13} /> 계약 기간
                    </span>
                    <span className="font-medium">{brand.contractPeriod}년</span>
                  </div>
                )}
                {brand.adFee !== null && brand.adFee !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <FileText size={13} /> 광고분담금
                    </span>
                    <span className="font-medium">{brand.adFee}%</span>
                  </div>
                )}
                {brand.directStoreCount !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Store size={13} /> 직영점
                    </span>
                    <span className="font-medium">{formatNumber(brand.directStoreCount)}개</span>
                  </div>
                )}
              </div>

              {brand.franchiseStartDate && (
                <p className="text-xs text-gray-400 mt-3">
                  가맹사업 시작: {formatDate(brand.franchiseStartDate)}
                </p>
              )}
            </div>

            {/* 구독 버튼 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                {brand._count.subscriptions.toLocaleString()}명이 관심 중
              </p>
              <button className="w-full bg-green-800 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 transition-colors">
                관심 브랜드 추가
              </button>
            </div>
          </div>

          {/* 오른쪽: 게시판 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* 게시판 탭 */}
              <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                <Link
                  href={`/brand/${slug}`}
                  className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    !board
                      ? "border-green-800 text-green-800"
                      : "border-transparent text-gray-500 hover:text-gray-800"
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
                      className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        board === type
                          ? "border-green-800 text-green-800"
                          : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {icon} {label}
                    </Link>
                  );
                })}
              </div>

              {/* 글 작성 버튼 */}
              <div className="px-4 py-3 border-b border-gray-50 flex justify-end">
                <Link
                  href={`/community/write?brandId=${brand.id}&board=${board || "FREE"}`}
                  className="bg-green-800 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  글 작성
                </Link>
              </div>

              {/* 게시글 목록 */}
              <div className="divide-y divide-gray-50">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    아직 게시글이 없습니다. 첫 글을 작성해보세요!
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        createdAt: post.createdAt.toISOString(),
                        author: post.isAnonymous ? null : post.author,
                      }}
                    />
                  ))
                )}
              </div>

              {posts.length === 10 && (
                <div className="p-4 text-center">
                  <Link
                    href={`/community?brandId=${brand.id}${board ? `&board=${board}` : ""}`}
                    className="text-sm text-green-700 hover:underline"
                  >
                    게시글 더 보기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 하단 AdSense */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <AdSensePlaceholder format="horizontal" />
      </div>
    </div>
  );
}
