import Link from "next/link";
import { formatRelativeTime, boardTypeLabel } from "@/lib/utils";
import { Eye, MessageSquare, Shield } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    boardType: string;
    isAnonymous: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: string | Date;
    author: { nickname?: string | null; verifyLevel: string } | null;
    brand?: { name: string; slug: string } | null;
    _count: { comments: number };
  };
}

export default function PostCard({ post }: PostCardProps) {
  const board = boardTypeLabel(post.boardType);

  return (
    <Link
      href={`/community/${post.id}`}
      className="block bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:border-green-200 hover:bg-green-50/30 transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="shrink-0 text-sm">{board.icon}</span>
        <span className="text-xs text-gray-400 shrink-0">{board.label}</span>
        {post.brand && (
          <>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-green-700 font-medium truncate">{post.brand.name}</span>
          </>
        )}
      </div>
      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-snug mb-2">
        {post.title}
      </h3>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          {post.isAnonymous ? (
            "익명"
          ) : (
            <>
              {post.author?.verifyLevel === "VERIFIED" && (
                <Shield size={10} className="text-green-600" />
              )}
              {post.author?.nickname ?? "탈퇴회원"}
            </>
          )}
        </span>
        <span>{formatRelativeTime(post.createdAt)}</span>
        <span className="flex items-center gap-0.5">
          <Eye size={11} /> {post.viewCount}
        </span>
        <span className="flex items-center gap-0.5">
          <MessageSquare size={11} /> {post._count.comments}
        </span>
      </div>
    </Link>
  );
}
