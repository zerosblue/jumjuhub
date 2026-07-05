import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const hasNickname = !!session?.user?.nickname;

  const isSetupPage = nextUrl.pathname === "/profile/setup";
  const isAuthPage = nextUrl.pathname.startsWith("/auth");
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublic = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/brand") || nextUrl.pathname.startsWith("/community");

  // 로그인됐는데 닉네임 없으면 setup으로
  if (isLoggedIn && !hasNickname && !isSetupPage && !isApiRoute && !isAuthPage) {
    return NextResponse.redirect(new URL("/profile/setup", nextUrl));
  }

  // setup 페이지는 로그인 필수
  if (!isLoggedIn && isSetupPage) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|icons).*)"],
};
