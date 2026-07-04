"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatRelativeTime } from "@/lib/utils";
import { Shield, CornerDownRight } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  isAnonymous: boolean;
  isBlinded: boolean;
  createdAt: string;
  author: { id: string; nickname?: string | null; verifyLevel: string } | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitComment = async (parentId?: string) => {
    const text = parentId ? replyContent : content;
    if (!text.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text,
        postId,
        parentId,
        isAnonymous,
      }),
    });

    if (res.ok) {
      const newComment = await res.json();
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
        setReplyContent("");
        setReplyTo(null);
      } else {
        setComments((prev) => [...prev, { ...newComment, replies: [] }]);
        setContent("");
      }
    }
    setSubmitting(false);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-8 mt-3" : "border-b border-gray-100 py-4"}`}>
      {isReply && <CornerDownRight size={14} className="inline mr-1 text-gray-300" />}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        {comment.isAnonymous ? (
          <span className="font-medium text-gray-600">익명</span>
        ) : (
          <span className="font-medium text-gray-700 flex items-center gap-1">
            {comment.author?.verifyLevel === "VERIFIED" && (
              <Shield size={10} className="text-green-600" />
            )}
            {comment.author?.nickname ?? "탈퇴회원"}
          </span>
        )}
        <span>{formatRelativeTime(comment.createdAt)}</span>
      </div>
      {comment.isBlinded ? (
        <p className="text-sm text-gray-400 italic">신고로 인해 블라인드된 댓글입니다.</p>
      ) : (
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
      )}
      {session && !isReply && (
        <button
          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
          className="text-xs text-gray-400 hover:text-green-700 mt-1"
        >
          답글
        </button>
      )}
      {replyTo === comment.id && (
        <div className="mt-2 ml-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요"
            rows={2}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-gray-400 px-3 py-1"
            >
              취소
            </button>
            <button
              onClick={() => submitComment(comment.id)}
              disabled={submitting}
              className="text-xs bg-green-800 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              등록
            </button>
          </div>
        </div>
      )}
      {comment.replies?.map((r) => renderComment(r, true))}
    </div>
  );

  return (
    <div className="mt-6">
      <h3 className="font-bold text-gray-900 mb-4">댓글 {comments.length}개</h3>

      {comments.map((c) => renderComment(c))}

      {session ? (
        <div className="mt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              익명으로 작성
            </label>
            <button
              onClick={() => submitComment()}
              disabled={submitting || !content.trim()}
              className="bg-green-800 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "등록 중..." : "댓글 등록"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-xl">
          댓글을 작성하려면{" "}
          <a href="/auth/signin" className="text-green-700 underline">
            로그인
          </a>
          이 필요합니다.
        </div>
      )}
    </div>
  );
}
