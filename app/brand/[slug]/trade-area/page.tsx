import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BrandLogo from "@/components/BrandLogo";
import BrandTabs from "@/components/BrandTabs";
import TradeAreaAnalysis from "@/components/TradeAreaAnalysis";
import { resolveUpjong } from "@/lib/trade-area";
import { ChevronRight } from "lucide-react";

async function getBrand(slug: string) {
  return prisma.brand.findUnique({
    where: { slug },
    select: { name: true, slug: true, category: true, subcategory: true, logoUrl: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const brand = await getBrand(slug);
  if (!brand) return {};
  return {
    title: `${brand.name} 상권분석 · 주변 경쟁점포 확인`,
    description: `${brand.name} 창업 예정지 상권분석 — 반경 내 동일 업종 점포, ${brand.name} 매장 위치, 업종 밀집도, 경쟁 브랜드 순위를 지도로 확인하세요.`,
    keywords: [`${brand.name} 상권분석`, `${brand.name} 창업`, "상권분석", "프랜차이즈 창업", "경쟁점포"],
  };
}

export default async function TradeAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const brand = await getBrand(slug);
  if (!brand) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-green-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-1.5 text-green-300 text-xs mb-4">
            <Link href="/brand" className="hover:text-white transition-colors">브랜드 탐색</Link>
            <ChevronRight size={12} />
            <Link href={`/brand/${brand.slug}`} className="hover:text-white transition-colors">{brand.name}</Link>
            <ChevronRight size={12} />
            <span className="text-green-200">상권 분석</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              <BrandLogo name={brand.name} logoUrl={brand.logoUrl} size="md" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">{brand.name} 상권 분석</h1>
              <p className="text-green-200 text-sm">
                창업 예정지 주변 {resolveUpjong(brand.subcategory, brand.category, brand.name)?.label ?? brand.subcategory ?? brand.category} 경쟁 현황을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      <BrandTabs slug={brand.slug} active="trade" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <TradeAreaAnalysis brandSlug={brand.slug} brandName={brand.name} />
      </main>
    </div>
  );
}
