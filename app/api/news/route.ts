import { NextResponse } from "next/server";

export const revalidate = 3600; // 1시간 캐시

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

async function fetchRss(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

    for (const item of itemMatches.slice(0, 10)) {
      const title = stripHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const link = (item.match(/<link>([\s\S]*?)<\/link>/) ?? item.match(/<link\s[^>]*href="([^"]+)"/))?.[1]?.trim() ?? "";
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

      if (title && link) {
        items.push({ title, link, pubDate, source });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const queries = ["프랜차이즈", "가맹점", "창업"];

  const results = await Promise.all(
    queries.map((q) =>
      fetchRss(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`,
        "Google 뉴스"
      )
    )
  );

  const all = results.flat();

  // 중복 제거 (링크 기준)
  const seen = new Set<string>();
  const unique = all.filter((n) => {
    if (seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  // 날짜 정렬
  unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return NextResponse.json(unique.slice(0, 20));
}
