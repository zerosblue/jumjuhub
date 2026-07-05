import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { getNews, NEWS_CATEGORIES } from "@/lib/news";
import { ExternalLink, Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "프랜차이즈 뉴스 | 점주허브",
  description: "창업, 폐점, 법률·정책, 업계동향, 점주이슈 등 프랜차이즈 최신 뉴스를 모아보세요.",
  openGraph: {
    title: "프랜차이즈 뉴스 | 점주허브",
    description: "프랜차이즈 업계 최신 뉴스를 카테고리별로 한눈에",
    type: "website",
  },
};

function formatPubDate(pubDate: string) {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function extractSource(link: string) {
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category && NEWS_CATEGORIES.includes(sp.category) ? sp.category : "전체";

  const news = await getNews(category, 30);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 히어로 */}
      <section className="bg-green-800 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper size={18} className="text-green-300" />
            <p className="text-green-300 text-xs font-medium">Google 뉴스 실시간 수집</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">프랜차이즈 뉴스</h1>
          <p className="text-green-200 text-sm">창업·폐점·법률·업계동향·점주이슈 최신 뉴스</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {NEWS_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "전체" ? "/news" : `/news?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                category === cat
                  ? "bg-green-800 text-white border-green-800 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-800"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* 뉴스 목록 */}
        {news.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Newspaper size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">뉴스를 불러오는 중입니다.</p>
            <p className="text-sm mt-1">잠시 후 다시 시도해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      {item.category}
                    </span>
                    {item.link && (
                      <span className="text-xs text-gray-400 truncate">{extractSource(item.link)}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-green-800 leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatPubDate(item.pubDate)}</p>
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-green-500 shrink-0 mt-1 transition-colors" />
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          뉴스는 Google 뉴스에서 수집되며 1시간마다 갱신됩니다.
        </p>
      </main>
    </div>
  );
}
