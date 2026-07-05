"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { Bell, MessageSquare, Reply, Star, Shield, Info, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  COMMENT:        { icon: MessageSquare, color: "text-blue-500" },
  REPLY:          { icon: Reply,         color: "text-indigo-500" },
  BRAND_NEW_POST: { icon: Star,          color: "text-amber-500" },
  VERIFY_APPROVED:{ icon: Shield,        color: "text-green-600" },
  VERIFY_REJECTED:{ icon: Shield,        color: "text-red-500" },
  SYSTEM:         { icon: Info,          color: "text-gray-500" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { setNotifications(data); setLoading(false); });
  }, [status, router]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-700 transition-colors"
            >
              <CheckCheck size={14} />
              모두 읽음
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Bell size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">아직 알림이 없어요</p>
            <p className="text-xs text-gray-300 mt-1">댓글, 답글, 인증 결과 등이 여기 표시돼요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = TYPE_ICON[n.type] ?? TYPE_ICON.SYSTEM;
              const Icon = meta.icon;
              const content = (
                <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                  n.isRead ? "border-gray-100" : "border-green-200 bg-green-50/30"
                }`}>
                  <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? "text-gray-700" : "text-gray-900 font-medium"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                  )}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link}>{content}</Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
