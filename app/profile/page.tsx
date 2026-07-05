import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import { formatDate } from "@/lib/utils";
import { Shield, FileText, MessageSquare, Star } from "lucide-react";

async function getUserData(userId: string) {
  const [user, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        image: true,
        role: true,
        verifyLevel: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    prisma.post.findMany({
      where: { authorId: userId, isBlinded: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
        brand: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);
  return { user, posts };
}

const VERIFY_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  NONE: { label: "일반회원", color: "bg-gray-100 text-gray-600", icon: "👤" },
  SELF: { label: "점주 자기인증", color: "bg-blue-50 text-blue-700", icon: "✋" },
  VERIFIED: { label: "인증점주", color: "bg-green-50 text-green-700", icon: "✅" },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { user, posts } = await getUserData(session.user.id);
  if (!user) redirect("/auth/signin");

  const badge = VERIFY_BADGE[user.verifyLevel] ?? VERIFY_BADGE.NONE;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img src={user.image} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-black text-green-800">
                {(user.nickname ?? "U")[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-gray-900">{user.nickname}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                  {badge.icon} {badge.label}
                </span>
                {user.role === "ADMIN" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
                    🛡 관리자
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{formatDate(user.createdAt)} 가입</p>
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-900">{user._count.posts}</p>
              <p className="text-xs text-gray-500 mt-0.5">작성 게시글</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-900">{user._count.comments}</p>
              <p className="text-xs text-gray-500 mt-0.5">작성 댓글</p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 mt-4">
            <NicknameEditButton currentNickname={user.nickname ?? ""} />
            <Link
              href="/profile/verify"
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Shield size={14} /> 점주 인증
            </Link>
          </div>
        </div>

        {/* 점주 인증 안내 */}
        {user.verifyLevel === "NONE" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-xl shrink-0">⭐</span>
            <div>
              <p className="text-sm font-bold text-amber-800">점주 인증하고 후기를 남겨보세요</p>
              <p className="text-xs text-amber-600 mt-0.5">
                점주 인증 후 '점주 실제후기' 게시판에 글을 쓸 수 있어요.
              </p>
              <Link href="/profile/verify" className="text-xs text-amber-700 font-medium underline mt-1 inline-block">
                인증하러 가기 →
              </Link>
            </div>
          </div>
        )}

        {/* 내 게시글 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">내가 쓴 글</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              아직 작성한 글이 없습니다.
              <br />
              <Link href="/community/write" className="text-green-700 underline mt-2 inline-block">
                첫 글 작성하기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    createdAt: post.createdAt.toISOString(),
                    author: post.isAnonymous ? null : post.author,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NicknameEditButton({ currentNickname }: { currentNickname: string }) {
  return (
    <Link
      href="/profile/edit"
      className="flex-1 flex items-center justify-center gap-1.5 bg-green-800 text-white text-sm font-medium py-2 rounded-xl hover:bg-green-700 transition-colors"
    >
      닉네임 변경
    </Link>
  );
}
