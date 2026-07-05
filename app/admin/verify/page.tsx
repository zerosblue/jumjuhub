import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import VerifyReviewCard from "@/components/admin/VerifyReviewCard";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

async function getVerifications() {
  const [pending, processed] = await Promise.all([
    prisma.verification.findMany({
      where: { status: "PENDING", type: "DOCUMENT" },
      include: { user: { select: { nickname: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.verification.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] }, type: "DOCUMENT" },
      include: { user: { select: { nickname: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  return { pending, processed };
}

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { pending, processed } = await getVerifications();

  const serialize = (v: (typeof pending)[number]) => ({
    id: v.id,
    type: v.type,
    brandName: v.brandName,
    documentUrl: v.documentUrl,
    status: v.status,
    note: v.note,
    createdAt: v.createdAt.toISOString(),
    user: v.user,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft size={14} /> 관리자 대시보드
        </Link>

        <h1 className="text-xl font-black text-gray-900 mb-1 flex items-center gap-2">
          <ShieldCheck size={20} className="text-green-700" />
          점주 인증 관리
        </h1>
        <p className="text-sm text-gray-500 mb-6">사업자등록증 인증 신청을 검토하고 승인/거부합니다.</p>

        {/* 대기 목록 */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            인증 대기 <span className="text-amber-600">({pending.length})</span>
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              대기 중인 인증 신청이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((v) => (
                <VerifyReviewCard key={v.id} verification={serialize(v)} />
              ))}
            </div>
          )}
        </section>

        {/* 처리 완료 목록 */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3">최근 처리 내역</h2>
          {processed.length === 0 ? (
            <p className="text-sm text-gray-400">처리된 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {processed.map((v) => (
                <VerifyReviewCard key={v.id} verification={serialize(v)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
