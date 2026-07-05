import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
      brand: { select: { id: true, name: true, slug: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
            },
          },
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return NextResponse.json({
    ...post,
    author: post.isAnonymous ? null : post.author,
    comments: post.comments.map((c) => ({
      ...c,
      author: c.isAnonymous ? null : c.author,
      replies: c.replies.map((r) => ({
        ...r,
        author: r.isAnonymous ? null : r.author,
      })),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, images } = body;

  if (!title || title.length < 2) return NextResponse.json({ error: "제목을 2자 이상 입력해주세요." }, { status: 400 });
  if (!content || content.length < 5) return NextResponse.json({ error: "내용을 5자 이상 입력해주세요." }, { status: 400 });

  const updated = await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      images: Array.isArray(images) ? images : post.images,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
