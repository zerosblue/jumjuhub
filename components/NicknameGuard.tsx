"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const EXCLUDED = ["/auth", "/profile/setup", "/api"];

export default function NicknameGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) return;
    if (EXCLUDED.some((p) => pathname.startsWith(p))) return;

    if (!session.user.nickname) {
      router.replace("/profile/setup");
    }
  }, [session, status, pathname, router]);

  return null;
}
