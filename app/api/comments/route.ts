import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1).max(2000),
  postId: z.string(),
  parentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.isBanned) {
    return NextResponse.json({ error: "이용이 제한된 계정입니다." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, postId, parentId, isAnonymous } = parsed.data;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true },
  });
  if (!post) return NextResponse.json({ error: "게시글 없음" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: session.user.id,
      postId,
      parentId: parentId || null,
      isAnonymous,
    },
    include: {
      author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
    },
  });

  // 작성자에게 알림 (본인 글 제외)
  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        message: `"${post.title.slice(0, 30)}"에 댓글이 달렸습니다.`,
        link: `/community/${postId}`,
      },
    });
  }

  return NextResponse.json(
    { ...comment, author: isAnonymous ? null : comment.author },
    { status: 201 }
  );
}
