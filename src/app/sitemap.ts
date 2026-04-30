import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://word.tanahiro2010.com";

  const decks = await prisma.deck.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true, publishedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const urls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/decks`,
      lastModified: new Date(),
    },
    ...decks.map((d) => ({
      url: `${baseUrl}/decks/${d.id}`,
      lastModified: d.updatedAt ?? d.publishedAt ?? undefined,
    })),
  ];

  return urls;
}
