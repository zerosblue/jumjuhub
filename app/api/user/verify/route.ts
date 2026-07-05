import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["SELF", "DOCUMENT"]),
  brandName: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const { type, brandName } = parsed.data;

  if (type === "SELF") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { verifyLevel: "SELF" },
    });
    await prisma.verification.create({
      data: { userId: session.user.id, type: "SELF", brandName, status: "APPROVED" },
    });
    return NextResponse.json({ ok: true });
  }

  // DOCUMENT: 관리자 검토 대기
  await prisma.verification.create({
    data: { userId: session.user.id, type: "DOCUMENT", brandName, status: "PENDING" },
  });
  return NextResponse.json({ ok: true, message: "서류 인증 요청이 접수되었습니다." });
}
