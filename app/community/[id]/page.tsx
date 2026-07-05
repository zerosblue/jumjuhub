import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import CommentSection from "@/components/CommentSection";
import { formatDate, boardTypeLabel } from "@/lib/utils";
import { Shield, Eye, ArrowLeft } from "lucide-react";

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
      brand: { select: { id: true, name: true, slug: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
            },
          },
        },
      },
    },
  });
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true, content: true } });
  if (!post) return {};
  return {
    title: post.title,
    description: post.content.slice(0, 150),
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  // viewCount 증가 — 실패해도 페이지 렌더링은 계속
  prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const board = boardTypeLabel(post.boardType);
  const displayAuthor = post.isAnonymous ? null : post.author;

  const comments = post.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    author: c.isAnonymous ? null : c.author,
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      author: r.isAnonymous ? null : r.author,
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* 뒤로가기 */}
        <div className="mb-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft size={14} /> 목록으로
          </Link>
        </div>

        <article className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* 게시판 배지 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{board.icon}</span>
            <span className="text-xs text-gray-500">{board.label}</span>
            {post.brand && (
              <>
                <span className="text-gray-300">·</span>
                <Link
                  href={`/brand/${post.brand.slug}`}
                  className="text-xs text-green-700 hover:underline font-medium"
                >
                  {post.brand.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="text-xl font-black text-gray-900 mb-4 leading-snug">{post.title}</h1>

          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            {displayAuthor?.image ? (
              <img src={displayAuthor.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm">
                {post.isAnonymous ? "?" : (displayAuthor?.nickname ?? "U")[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                {post.isAnonymous ? (
                  "익명"
                ) : (
                  <>
                    {displayAuthor?.verifyLevel === "VERIFIED" && (
                      <Shield size={12} className="text-green-600" />
                    )}
                    {displayAuthor?.nickname ?? "탈퇴회원"}
                    {displayAuthor?.verifyLevel === "VERIFIED" && (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-normal">
                        인증점주
                      </span>
                    )}
                    {displayAuthor?.verifyLevel === "SELF" && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-normal">
                        점주자인증
                      </span>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(post.createdAt)} · <Eye size={10} className="inline" /> {post.viewCount}
              </p>
            </div>
          </div>

          {/* 본문 */}
          {post.isBlinded ? (
            <p className="text-gray-400 italic py-8 text-center">
              신고로 인해 블라인드된 게시글입니다.
            </p>
          ) : (
            <>
              <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                {post.content}
              </div>
              {post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {post.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="rounded-lg w-full object-cover max-h-64"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </article>

        {/* 댓글 */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6">
          <CommentSection postId={post.id} initialComments={comments as any} />
        </div>
      </main>
    </div>
  );
}
