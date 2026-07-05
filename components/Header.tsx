"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Bell, Menu, X, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: any[]) => setUnreadCount(data.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [session?.user]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-green-800">점주허브</span>
            <span className="hidden sm:block text-xs text-gray-400 font-normal mt-0.5">JumjuHub</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/brand" className="hover:text-green-800 transition-colors">브랜드 탐색</Link>
            <Link href="/community" className="hover:text-green-800 transition-colors">커뮤니티</Link>
            <Link href="/community?board=QNA" className="hover:text-green-800 transition-colors">창업 질문</Link>
            <Link href="/community?board=REPORT_ABUSE" className="hover:text-green-800 transition-colors">갑질 제보</Link>
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-green-800">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-green-800"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs">
                        {(session.user.nickname ?? session.user.name ?? "U")[0]}
                      </div>
                    )}
                    <span className="hidden sm:block">{session.user.nickname ?? session.user.name}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={14} /> 내 프로필
                      </Link>
                      <Link href="/profile/edit" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={14} /> 프로필 수정
                      </Link>
                      <Link href="/profile/verify" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={14} /> 점주 인증
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50">
                          <Settings size={14} /> 관리자 페이지
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut size={14} /> 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-green-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                로그인
              </Link>
            )}

            {/* 모바일 메뉴 */}
            <button
              className="md:hidden p-2 text-gray-500"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {[
              { href: "/brand", label: "브랜드 탐색" },
              { href: "/community", label: "전체 커뮤니티" },
              { href: "/community?board=QNA", label: "창업 질문" },
              { href: "/community?board=REPORT_ABUSE", label: "갑질 제보" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-2 py-2 text-sm text-gray-700 hover:text-green-800 hover:bg-gray-50 rounded"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
