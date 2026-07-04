import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string(),
  reason: z.string().min(5).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetType, targetId, reason } = parsed.data;

  const existing = await prisma.report.findFirst({
    where: {
      targetType: targetType as any,
      targetId,
      reporterId: session.user.id,
    },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 신고한 콘텐츠입니다." }, { status: 409 });
  }

  const reportData: any = {
    targetType: targetType as any,
    targetId,
    reason,
    reporterId: session.user.id,
  };

  if (targetType === "POST") reportData.postId = targetId;
  if (targetType === "COMMENT") reportData.commentId = targetId;

  await prisma.report.create({ data: reportData });

  // 신고 5회 시 자동 블라인드
  if (targetType === "POST") {
    const count = await prisma.report.count({ where: { postId: targetId } });
    if (count >= 5) {
      await prisma.post.update({ where: { id: targetId }, data: { isBlinded: true, reportCount: count } });
    } else {
      await prisma.post.update({ where: { id: targetId }, data: { reportCount: count } });
    }
  } else {
    const count = await prisma.report.count({ where: { commentId: targetId } });
    if (count >= 5) {
      await prisma.comment.update({ where: { id: targetId }, data: { isBlinded: true, reportCount: count } });
    } else {
      await prisma.comment.update({ where: { id: targetId }, data: { reportCount: count } });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
