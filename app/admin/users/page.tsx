import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatDate } from "@/lib/utils";

const LIMIT = 30;

async function getUsers(q: string, page: number) {
  const where: any = {};
  if (q) {
    where.OR = [
      { nickname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
        verifyLevel: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, totalPages: Math.ceil(total / LIMIT) };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = parseInt(sp.page ?? "1");

  const { users, total, totalPages } = await getUsers(q, page);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
          <h1 className="text-xl font-black text-gray-900">전체 회원 목록</h1>
          <span className="text-sm text-gray-400">({total.toLocaleString()}명)</span>
        </div>

        {/* 검색 */}
        <form method="GET" className="mb-6 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="닉네임 또는 이메일 검색"
            className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button type="submit" className="px-4 py-2 bg-green-800 text-white text-sm rounded-xl hover:bg-green-700">
            검색
          </button>
          {q && (
            <Link href="/admin/users" className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50">
              초기화
            </Link>
          )}
        </form>

        {/* 유저 테이블 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">닉네임 / 이메일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">권한</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">인증</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">게시글</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">댓글</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className={u.isBanned ? "bg-red-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.nickname ?? "—"}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "BOT"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role === "ADMIN" ? "관리자" : u.role === "BOT" ? "봇" : "일반"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.verifyLevel === "VERIFIED"
                          ? "bg-green-100 text-green-700"
                          : u.verifyLevel === "SELF"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {u.verifyLevel === "VERIFIED" ? "인증점주" : u.verifyLevel === "SELF" ? "자기신고" : "미인증"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{u._count.posts}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{u._count.comments}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <BanToggleButton userId={u.id} isBanned={u.isBanned ?? false} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/users?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
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

function BanToggleButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  return (
    <form action={async () => {
      "use server";
      await prisma.user.update({ where: { id: userId }, data: { isBanned: !isBanned } });
      revalidatePath("/admin/users");
    }}>
      <button
        type="submit"
        className={`text-xs px-2 py-1 rounded font-medium ${
          isBanned
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-red-100 text-red-600 hover:bg-red-200"
        }`}
      >
        {isBanned ? "정지해제" : "정지"}
      </button>
    </form>
  );
}
