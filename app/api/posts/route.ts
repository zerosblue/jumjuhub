import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hashIp } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(5).max(10000),
  brandId: z.string().optional(),
  boardType: z.enum(["NOTICE", "QNA", "REVIEW", "FREE", "REPORT_ABUSE", "TRADE"]),
  isAnonymous: z.boolean().default(false),
  images: z.array(z.string().url()).max(5).default([]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const boardType = searchParams.get("boardType");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const q = searchParams.get("q");

  const where: any = { isBlinded: false };
  if (brandId) where.brandId = brandId;
  if (boardType) where.boardType = boardType;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
        brand: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      author: p.isAnonymous ? null : p.author,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.isBanned) {
    return NextResponse.json({ error: "이용이 제한된 계정입니다." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, content, brandId, boardType, isAnonymous, images } = parsed.data;

  if (boardType === "REVIEW" && session.user.verifyLevel === "NONE") {
    return NextResponse.json(
      { error: "점주 후기는 점주 인증 후 작성 가능합니다." },
      { status: 403 }
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const ipHash = hashIp(ip);

  // 스팸 방지: 1시간 내 5개 이상 제한
  const recentCount = await prisma.post.count({
    where: {
      authorId: session.user.id,
      createdAt: { gte: new Date(Date.now() - 3600000) },
    },
  });
  if (recentCount >= 5) {
    return NextResponse.json(
      { error: "1시간 내 게시글 작성 한도(5개)를 초과했습니다." },
      { status: 429 }
    );
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
      brandId: brandId || null,
      boardType: boardType as any,
      isAnonymous,
      images,
      lastIpHash: ipHash,
    },
  });

  // 브랜드 구독자에게 알림
  if (brandId) {
    const subs = await prisma.brandSubscription.findMany({
      where: { brandId, userId: { not: session.user.id } },
      select: { userId: true },
    });
    if (subs.length > 0) {
      await prisma.notification.createMany({
        data: subs.map((s) => ({
          userId: s.userId,
          type: "BRAND_NEW_POST" as const,
          message: `관심 브랜드에 새 글이 등록되었습니다: ${title}`,
          link: `/community/${post.id}`,
        })),
      });
    }
  }

  return NextResponse.json(post, { status: 201 });
}
