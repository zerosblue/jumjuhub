import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|scan|monitor|python|curl|wget|axios|http/i;

function kstToday(): Date {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  const session = await auth();
  if (session?.user?.role === "ADMIN") return new NextResponse(null, { status: 204 });

  let visitorId = req.cookies.get("jj_vid")?.value;
  const isNew = !visitorId;
  if (!visitorId) visitorId = randomUUID();

  try {
    await prisma.dailyVisitor.upsert({
      where: { date_visitorId: { date: kstToday(), visitorId } },
      update: {},
      create: { date: kstToday(), visitorId },
    });
  } catch {}

  const res = new NextResponse(null, { status: 204 });
  if (isNew) {
    res.cookies.set("jj_vid", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
