import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { z } from "zod";

const schema = z.object({
  verificationId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "DELETE_IMAGE"]),
  rejectReason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const { verificationId, action, rejectReason } = parsed.data;

  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: { user: { select: { id: true, nickname: true } } },
  });
  if (!verification) return NextResponse.json({ error: "인증 요청을 찾을 수 없습니다." }, { status: 404 });

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.verification.update({
        where: { id: verificationId },
        data: { status: "APPROVED", note: null },
      }),
      prisma.user.update({
        where: { id: verification.userId },
        data: { verifyLevel: "VERIFIED", isVerified: true },
      }),
      prisma.notification.create({
        data: {
          userId: verification.userId,
          type: "VERIFY_APPROVED",
          message: "🎉 점주 공식 인증이 승인되었습니다! 모든 게시판을 이용할 수 있습니다.",
          link: "/profile",
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.verification.update({
        where: { id: verificationId },
        data: { status: "REJECTED", note: rejectReason || null },
      }),
      prisma.notification.create({
        data: {
          userId: verification.userId,
          type: "VERIFY_REJECTED",
          message: `점주 인증이 거부되었습니다.${rejectReason ? ` 사유: ${rejectReason}` : ""} 다시 신청할 수 있습니다.`,
          link: "/profile/verify",
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // DELETE_IMAGE: 승인 완료 후 사업자등록증 이미지 삭제
  if (!verification.documentUrl) {
    return NextResponse.json({ error: "삭제할 이미지가 없습니다." }, { status: 400 });
  }
  try {
    await del(verification.documentUrl);
  } catch {}
  await prisma.verification.update({
    where: { id: verificationId },
    data: { documentUrl: null },
  });
  return NextResponse.json({ ok: true });
}
