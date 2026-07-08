import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 카카오맵 SDK는 등록된 도메인(jumjuhub.com)에서만 동작하므로
// vercel.app 기본 도메인으로 들어온 프로덕션 트래픽은 커스텀 도메인으로 보낸다.
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host.endsWith(".vercel.app") && process.env.VERCEL_ENV === "production") {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://jumjuhub.com");
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
