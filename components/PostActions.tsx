"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface PostActionsProps {
  postId: string;
  authorId: string;
}

export default function PostActions({ postId, authorId }: PostActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isOwner = session?.user?.id === authorId;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isOwner && !isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/community");
        router.refresh();
      } else {
        alert("삭제에 실패했습니다.");
        setDeleting(false);
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/community/${postId}/edit`}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors"
      >
        <Pencil size={12} /> 수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 size={12} /> {deleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
