import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, likeCount: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.post.update({
    where: { id },
    data: { likeCount: { increment: 1 } },
    select: { likeCount: true },
  });

  return NextResponse.json({ likeCount: updated.likeCount });
}
