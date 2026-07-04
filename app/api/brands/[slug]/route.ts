import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      storeHistory: { orderBy: { year: "asc" } },
      _count: { select: { posts: true, subscriptions: true } },
    },
  });

  if (!brand) {
    return NextResponse.json({ error: "브랜드를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    ...brand,
    avgRevenue: brand.avgRevenue?.toString(),
    franchiseFee: brand.franchiseFee?.toString(),
    deposit: brand.deposit?.toString(),
    interiorCost: brand.interiorCost?.toString(),
    educationFee: brand.educationFee?.toString(),
  });
}
