import { formatCurrency } from "./utils";

export type BrandSeoInput = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  category?: string | null;
  storeCount?: number | null;
  avgRevenue?: bigint | null;
  franchiseFee?: bigint | null;
  deposit?: bigint | null;
  interiorCost?: bigint | null;
  educationFee?: bigint | null;
};

function kstYear(): number {
  return new Date(Date.now() + 9 * 3600 * 1000).getUTCFullYear();
}

export function brandTotalCost(b: BrandSeoInput): number {
  return [b.franchiseFee, b.deposit, b.interiorCost, b.educationFee]
    .filter((v): v is bigint => v != null)
    .reduce((acc, v) => acc + Number(v), 0);
}

export function brandSeoTitle(b: BrandSeoInput): string {
  return `${b.name} 창업비용 가맹비 평균매출 ${kstYear()}`;
}

export function brandSeoDescription(b: BrandSeoInput): string {
  const parts: string[] = [];
  const total = brandTotalCost(b);
  if (total > 0) parts.push(`실제 창업비용 ${formatCurrency(total)}`);
  if (b.storeCount) parts.push(`가맹점 수 ${b.storeCount.toLocaleString()}개`);
  if (b.avgRevenue) parts.push(`연평균 매출 ${formatCurrency(b.avgRevenue)}`);
  const lead = parts.length > 0 ? `${b.name} ${parts.join(", ")}.` : `${b.name} 창업 정보.`;
  return `${lead} 공정위 공식 데이터 기반 정보와 실제 점주 후기를 점주허브에서 확인하세요.`;
}

export function brandFaqItems(b: BrandSeoInput): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];

  const costParts: string[] = [];
  if (b.franchiseFee != null) costParts.push(`가맹비 ${formatCurrency(b.franchiseFee)}`);
  if (b.deposit != null) costParts.push(`보증금 ${formatCurrency(b.deposit)}`);
  if (b.interiorCost != null) costParts.push(`인테리어 ${formatCurrency(b.interiorCost)}`);
  if (b.educationFee != null) costParts.push(`교육비 ${formatCurrency(b.educationFee)}`);
  const total = brandTotalCost(b);
  if (costParts.length > 0 && total > 0) {
    items.push({
      q: `${b.name} 창업비용은 얼마인가요?`,
      a: `공정위 정보공개서 기준 ${costParts.join(", ")} 등 총 ${formatCurrency(total)}입니다. 점포 임차 보증금·월세·권리금 등 점포 비용은 별도입니다.`,
    });
  }

  if (b.avgRevenue != null && Number(b.avgRevenue) > 0) {
    const monthly = Math.round(Number(b.avgRevenue) / 12);
    items.push({
      q: `${b.name} 평균 매출은 얼마인가요?`,
      a: `공정위 데이터 기준 가맹점 연평균 매출은 ${formatCurrency(b.avgRevenue)}이며, 월평균 약 ${formatCurrency(monthly)} 수준입니다.`,
    });
  }

  if (b.storeCount != null && b.storeCount > 0) {
    items.push({
      q: `${b.name} 가맹점은 몇 개인가요?`,
      a: `공정위 최신 등록 기준 전국 ${b.storeCount.toLocaleString()}개 가맹점이 운영 중입니다.`,
    });
  }

  return items;
}

export function brandJsonLd(b: BrandSeoInput): object[] {
  const url = `https://jumjuhub.com/brand/${encodeURIComponent(b.slug)}`;
  const schemas: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: b.name,
      url,
      description: brandSeoDescription(b),
      ...(b.logoUrl ? { image: b.logoUrl, logo: b.logoUrl } : {}),
    },
  ];

  const faq = brandFaqItems(b);
  if (faq.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return schemas;
}
