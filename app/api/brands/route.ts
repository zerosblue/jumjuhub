import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const sort = searchParams.get("sort") ?? "popular";

  const where: any = { isHidden: false };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  const orderBy: any =
    sort === "revenue"
      ? { avgRevenue: "desc" }
      : sort === "stores"
      ? { storeCount: "desc" }
      : { storeCount: "desc" };

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

  return NextResponse.json({
    brands: brands.map((b) => ({
      ...b,
      avgRevenue: b.avgRevenue?.toString(),
      franchiseFee: b.franchiseFee?.toString(),
      deposit: b.deposit?.toString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
