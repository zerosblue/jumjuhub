import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { Search, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

async function toggleHidden(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return;
  const id = String(formData.get("id"));
  const hidden = formData.get("hidden") === "true";
  await prisma.brand.update({ where: { id }, data: { isHidden: !hidden } });
  revalidatePath("/admin/brands");
  revalidatePath("/brand");
}

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { q = "" } = await searchParams;

  const brands = await prisma.brand.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : { isHidden: true },
    orderBy: [{ isHidden: "desc" }, { name: "asc" }],
    take: 50,
    select: { id: true, name: true, category: true, subcategory: true, isHidden: true, storeCount: true },
  });

  const hiddenCount = await prisma.brand.count({ where: { isHidden: true } });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">브랜드 숨김 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              숨김 처리된 브랜드는 탐색·검색에서 제외됩니다. 현재 {hiddenCount}개 숨김.
            </p>
          </div>
          <Link href="/admin" className="text-xs text-green-700 hover:underline shrink-0">← 대시보드</Link>
        </div>

        <form method="GET" className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="브랜드명 검색 (비우면 숨김 브랜드만 표시)"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
          />
        </form>

        {brands.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <EyeOff size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{q ? "검색 결과가 없습니다." : "숨김 처리된 브랜드가 없습니다."}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 mr-3">
                  <p className={`text-sm font-medium ${b.isHidden ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {b.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.category}{b.subcategory ? ` · ${b.subcategory}` : ""}{b.storeCount ? ` · 가맹점 ${b.storeCount.toLocaleString()}개` : ""}
                  </p>
                </div>
                <form action={toggleHidden}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="hidden" value={String(b.isHidden)} />
                  <button
                    type="submit"
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap ${
                      b.isHidden
                        ? "bg-green-700 text-white hover:bg-green-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {b.isHidden ? "표시하기" : "숨기기"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
