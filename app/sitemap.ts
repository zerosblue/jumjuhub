import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: "https://jumjuhub.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://jumjuhub.com/brand",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://jumjuhub.com/community",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  try {
    const { prisma } = await import("@/lib/prisma");
    const brands = await prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
    });

    const brandUrls: MetadataRoute.Sitemap = brands.map((b) => ({
      url: `https://jumjuhub.com/brand/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...brandUrls];
  } catch {
    return staticRoutes;
  }
}
