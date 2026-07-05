"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { boardTypeLabel } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { upload } from "@vercel/blob/client";

const ALL_BOARDS = ["NOTICE", "QNA", "REVIEW", "FREE", "REPORT_ABUSE", "TRADE"] as const;
type BoardType = typeof ALL_BOARDS[number];

export default function WritePostContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAdmin = session?.user?.role === "ADMIN";
  const BOARDS = isAdmin ? ALL_BOARDS : ALL_BOARDS.filter((b) => b !== "NOTICE");

  const defaultBoard = (searchParams.get("board") ?? "FREE") as BoardType;
  const brandId = searchParams.get("brandId") ?? "";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [boardType, setBoardType] = useState<BoardType>(defaultBoard);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return null;
  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      setError("이미지는 최대 5장까지 첨부 가능합니다.");
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const blob = await upload(
          `uploads/${Date.now()}-${file.name}`,
          file,
          { access: "public", handleUploadUrl: "/api/upload" }
        );
        urls.push(blob.url);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError((err as Error).message || "이미지 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (boardType === "REVIEW" && session.user.verifyLevel === "NONE") {
      setError("점주 후기는 점주 인증 후 작성 가능합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          brandId: brandId || undefined,
          boardType,
          isAnonymous,
          images,
        }),
      });

      if (res.ok) {
        const post = await res.json();
        router.push(`/community/${post.id}`);
      } else {
        const text = await res.text().catch(() => "");
        let msg = "게시글 작성에 실패했습니다.";
        try { msg = JSON.parse(text).error ?? msg; } catch {}
        setError(msg);
        setSubmitting(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl font-black text-gray-900 mb-6">글 작성</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">게시판</label>
            <div className="flex flex-wrap gap-2">
              {BOARDS.map((b) => {
                const { label, icon } = boardTypeLabel(b);
                const disabled = b === "REVIEW" && session.user.verifyLevel === "NONE";
                return (
                  <button
                    key={b}
                    type="button"
                    disabled={disabled}
                    onClick={() => setBoardType(b)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      boardType === b
                        ? "bg-green-800 text-white border-green-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                    }`}
                  >
                    {icon} {label}
                    {disabled && " (인증 필요)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
              maxLength={200}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              required
              rows={10}
              maxLength={10000}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{content.length}/10000</p>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이미지 (최대 5장)</label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">
                    {uploading ? "업로드 중..." : "추가"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 익명 설정 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">익명으로 작성</span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !title.trim() || !content.trim()}
              className="px-5 py-2 text-sm bg-green-800 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {uploading ? "이미지 업로드 중..." : submitting ? "등록 중..." : "게시글 등록"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
