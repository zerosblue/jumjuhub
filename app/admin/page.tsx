import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import SyncButton from "@/components/admin/SyncButton";
import CostSyncButton from "@/components/admin/CostSyncButton";
import BrandToolsButton from "@/components/admin/BrandToolsButton";

async function getAdminStats() {
  const [userCount, postCount, pendingReports, pendingVerifications, brandCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.brand.count(),
    ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, nickname: true, email: true, role: true, verifyLevel: true, createdAt: true },
  });

  const pendingVerifs = await prisma.verification.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { nickname: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const reportedPosts = await prisma.post.findMany({
    where: { reportCount: { gte: 1 }, isBlinded: false },
    orderBy: { reportCount: "desc" },
    take: 10,
    select: { id: true, title: true, reportCount: true, createdAt: true },
  });

  // 최근 14일 방문자 (KST 기준, 관리자·봇 제외 집계)
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
  const kstToday = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()));
  const since = new Date(kstToday.getTime() - 13 * 24 * 3600 * 1000);
  const visitorRows = await prisma.dailyVisitor.groupBy({
    by: ["date"],
    where: { date: { gte: since } },
    _count: { _all: true },
    orderBy: { date: "desc" },
  });
  const dailyVisitors = visitorRows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    count: r._count._all,
  }));
  const todayVisitors =
    dailyVisitors.find((d) => d.date === kstToday.toISOString().slice(0, 10))?.count ?? 0;

  return { userCount, postCount, pendingReports, pendingVerifications, brandCount, recentUsers, pendingVerifs, reportedPosts, dailyVisitors, todayVisitors };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">관리자 대시보드</h1>

        {/* 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-8">
          {[
            { label: "오늘 방문자", value: stats.todayVisitors.toLocaleString(), color: "teal" },
            { label: "전체 회원", value: stats.userCount.toLocaleString(), color: "blue" },
            { label: "전체 게시글", value: stats.postCount.toLocaleString(), color: "green" },
            { label: "브랜드 수", value: stats.brandCount.toLocaleString(), color: "purple" },
            { label: "미처리 신고", value: stats.pendingReports.toLocaleString(), color: "red" },
            { label: "인증 대기", value: stats.pendingVerifications.toLocaleString(), color: "amber" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-black text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 점주 인증 대기 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">점주 인증 대기 ({stats.pendingVerifications})</h2>
              <Link href="/admin/verify" className="text-xs text-green-700 hover:underline">인증 관리 →</Link>
            </div>
            {stats.pendingVerifs.length === 0 ? (
              <p className="text-sm text-gray-400">대기 중인 인증이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {stats.pendingVerifs.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{v.user.nickname ?? v.user.email}</p>
                      <p className="text-xs text-gray-500">{v.type === "DOCUMENT" ? "사업자등록증 인증" : "자기신고"} · {v.brandName}</p>
                    </div>
                    <VerifyActions verificationId={v.id} userId={v.userId} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 신고된 게시글 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">신고 게시글 ({stats.pendingReports})</h2>
            {stats.reportedPosts.length === 0 ? (
              <p className="text-sm text-gray-400">신고된 게시글이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {stats.reportedPosts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0 mr-3">
                      <Link href={`/community/${p.id}`} className="text-sm font-medium hover:text-green-800 line-clamp-1">
                        {p.title}
                      </Link>
                      <p className="text-xs text-red-500 font-medium">신고 {p.reportCount}회</p>
                    </div>
                    <BlindPostButton postId={p.id} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 공정위 데이터 동기화 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">공정위 데이터 관리</h2>
            <SyncButton initialCount={stats.brandCount} />
          </section>

          {/* 창업비용 동기화 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">창업비용 데이터 동기화</h2>
            <CostSyncButton />
          </section>

          {/* 브랜드 데이터 정리 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">브랜드 데이터 정리</h2>
              <Link href="/admin/brands" className="text-xs text-green-700 hover:underline">숨김 관리 →</Link>
            </div>
            <BrandToolsButton />
          </section>

          {/* 방문자 통계 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1">방문자 통계 (최근 14일)</h2>
            <p className="text-xs text-gray-400 mb-4">관리자·봇 방문 제외, 일별 순 방문자 수 (KST)</p>
            {stats.dailyVisitors.length === 0 ? (
              <p className="text-sm text-gray-400">아직 집계된 방문 기록이 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {stats.dailyVisitors.map((d: any) => {
                  const max = Math.max(...stats.dailyVisitors.map((x: any) => x.count));
                  return (
                    <div key={d.date} className="flex items-center gap-2 text-sm">
                      <span className="w-20 shrink-0 text-xs text-gray-500">{d.date.slice(5)}</span>
                      <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                        <div
                          className="bg-green-600 h-full rounded"
                          style={{ width: `${Math.max(4, (d.count / max) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-medium text-gray-800">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 최근 가입자 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">최근 가입자</h2>
              <Link href="/admin/users" className="text-xs text-green-700 hover:underline">전체 보기 →</Link>
            </div>
            <div className="space-y-2">
              {stats.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{u.nickname ?? u.email}</span>
                  <span className="text-xs text-gray-400">
                    {u.role === "ADMIN" ? "관리자" : u.verifyLevel === "VERIFIED" ? "인증점주" : "일반회원"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function VerifyActions({ verificationId, userId }: { verificationId: string; userId: string }) {
  return (
    <div className="flex gap-1.5">
      <form action={async () => {
        "use server";
        await prisma.verification.update({ where: { id: verificationId }, data: { status: "APPROVED" } });
        await prisma.user.update({ where: { id: userId }, data: { verifyLevel: "VERIFIED", isVerified: true } });
        await prisma.notification.create({ data: { userId, type: "VERIFY_APPROVED", message: "점주 인증이 승인되었습니다." } });
      }}>
        <button type="submit" className="text-xs bg-green-700 text-white px-2 py-1 rounded">승인</button>
      </form>
      <form action={async () => {
        "use server";
        await prisma.verification.update({ where: { id: verificationId }, data: { status: "REJECTED" } });
        await prisma.notification.create({ data: { userId, type: "VERIFY_REJECTED", message: "점주 인증이 거부되었습니다. 관리자에게 문의하세요." } });
      }}>
        <button type="submit" className="text-xs bg-red-600 text-white px-2 py-1 rounded">거부</button>
      </form>
    </div>
  );
}

function BlindPostButton({ postId }: { postId: string }) {
  return (
    <form action={async () => {
      "use server";
      await prisma.post.update({ where: { id: postId }, data: { isBlinded: true } });
    }}>
      <button type="submit" className="text-xs bg-gray-600 text-white px-2 py-1 rounded whitespace-nowrap">블라인드</button>
    </form>
  );
}

