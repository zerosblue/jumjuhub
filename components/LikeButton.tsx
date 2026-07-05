"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

export default function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!session) {
      alert("로그인 후 좋아요를 누를 수 있습니다.");
      return;
    }
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCount(data.likeCount);
        setLiked(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
        liked
          ? "bg-red-50 border-red-200 text-red-500"
          : "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
      }`}
    >
      <Heart size={15} className={liked ? "fill-red-500 text-red-500" : ""} />
      {count > 0 ? count : "좋아요"}
    </button>
  );
}
