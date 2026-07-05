import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nickname: z.string().min(2).max(20).regex(/^[가-힣a-zA-Z0-9_]+$/, "닉네임은 한글, 영문, 숫자, _만 가능합니다."),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { nickname } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { nickname, id: { not: session.user.id } } });
  if (existing) return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname },
    select: { id: true, nickname: true, email: true, image: true, role: true, verifyLevel: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nickname: true,
      email: true,
      image: true,
      role: true,
      verifyLevel: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true } },
    },
  });

  return NextResponse.json(user);
}
