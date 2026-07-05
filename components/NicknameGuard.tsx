"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const EXCLUDED = ["/auth", "/profile/setup", "/api"];

export default function NicknameGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) return;
    if (EXCLUDED.some((p) => pathname.startsWith(p))) return;
    if (redirected.current) return;

    if (!session.user.nickname) {
      redirected.current = true;
      router.replace("/profile/setup");
    }
  }, [session, status, pathname, router]);

  // 닉네임이 생기면 리다이렉트 잠금 해제
  useEffect(() => {
    if (session?.user?.nickname) {
      redirected.current = false;
    }
  }, [session?.user?.nickname]);

  return null;
}
