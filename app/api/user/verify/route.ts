import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["SELF", "DOCUMENT"]),
  brandName: z.string().min(1).max(100),
  documentUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const { type, brandName, documentUrl } = parsed.data;
  const userId = session.user.id;

  if (type === "SELF") {
    if (session.user.verifyLevel === "SELF" || session.user.verifyLevel === "VERIFIED") {
      return NextResponse.json({ error: "이미 인증된 계정입니다." }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { verifyLevel: "SELF" } }),
      prisma.verification.create({ data: { userId, type: "SELF", brandName, status: "APPROVED" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // DOCUMENT
  if (!documentUrl) return NextResponse.json({ error: "사업자등록증 이미지가 필요합니다." }, { status: 400 });

  const existing = await prisma.verification.findFirst({
    where: { userId, type: "DOCUMENT", status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "이미 인증 대기 중입니다." }, { status: 400 });

  await prisma.verification.create({
    data: { userId, type: "DOCUMENT", brandName, documentUrl, status: "PENDING" },
  });
  return NextResponse.json({ ok: true, message: "인증 신청이 완료되었습니다." });
}
