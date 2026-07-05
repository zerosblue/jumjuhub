"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfileSetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });

    if (res.ok) {
      await update(); // 세션 갱신
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <h1 className="text-xl font-black text-gray-900">닉네임을 정해주세요</h1>
          <p className="text-sm text-gray-500 mt-1">커뮤니티에서 사용할 이름입니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (2~20자)"
              maxLength={20}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-center text-lg font-medium"
            />
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              한글, 영문, 숫자, _ 사용 가능
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || nickname.length < 2}
            className="w-full bg-green-800 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "저장 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
