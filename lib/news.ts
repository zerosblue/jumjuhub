export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  category: string;
}

const CATEGORY_QUERIES: Record<string, string[]> = {
  전체: ["프랜차이즈", "가맹점", "창업"],
  창업: ["프랜차이즈 창업"],
  폐점: ["가맹점 폐점 해지"],
  "법률·정책": ["가맹사업 법률 정책 공정거래"],
  업계동향: ["프랜차이즈 동향 업계"],
  점주이슈: ["가맹본부 점주 갑질"],
};

export const NEWS_CATEGORIES = Object.keys(CATEGORY_QUERIES);

function stripHtml(str: string) {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchRss(query: string, category: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const matches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    for (const item of matches.slice(0, 8)) {
      const title = stripHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
      if (title && link) items.push({ title, link, pubDate, category });
    }
    return items;
  } catch {
    return [];
  }
}

export async function getNews(category = "전체", limit = 20): Promise<NewsItem[]> {
  const queries = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES["전체"];
  const results = await Promise.all(queries.map((q) => fetchRss(q, category)));
  const all = results.flat();

  const seen = new Set<string>();
  const unique = all.filter((n) => {
    if (seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return unique.slice(0, limit);
}
