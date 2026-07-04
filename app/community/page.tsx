import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import { boardTypeLabel } from "@/lib/utils";

const BOARDS = ["NOTICE", "QNA", "REVIEW", "FREE", "REPORT_ABUSE", "TRADE"];

async function getPosts(board: string, page: number, q: string) {
  const limit = 20;
  const where: any = { isBlinded: false };
  if (board) where.boardType = board;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, nickname: true, image: true, verifyLevel: true } },
        brand: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      author: p.isAnonymous ? null : p.author,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const board = sp.board ?? "";
  const page = parseInt(sp.page ?? "1");
  const q = sp.q ?? "";

  const { posts, total, totalPages } = await getPosts(board, page, q);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-gray-900">커뮤니티</h1>
          <Link
            href="/community/write"
            className="bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            글 작성
          </Link>
        </div>

        {/* 게시판 탭 */}
        <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
          <Link
            href="/community"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !board ? "bg-green-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            전체
          </Link>
          {BOARDS.map((b) => {
            const { label, icon } = boardTypeLabel(b);
            return (
              <Link
                key={b}
                href={`/community?board=${b}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  board === b
                    ? "bg-green-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {icon} {label}
              </Link>
            );
          })}
        </div>

        {/* 검색 */}
        <form className="mb-4" method="get" action="/community">
          {board && <input type="hidden" name="board" value={board} />}
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="게시글 검색..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              검색
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 mb-3">{total.toLocaleString()}개 게시글</p>

        <div className="space-y-2">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post as any} />)
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/community?${board ? `board=${board}&` : ""}${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
                  p === page
                    ? "bg-green-800 text-white border-green-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
