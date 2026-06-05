import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [categories, areas, businesses] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true }
    }),
    prisma.location.findMany({
      where: { isActive: true, type: "AREA" },
      select: { slug: true }
    }),
    prisma.business.findMany({
      where: { listingStatus: "PUBLISHED" },
      select: { slug: true, updatedAt: true }
    })
  ]);

  const staticRoutes = [
    "",
    "/businesses",
    "/pricing",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/verification-policy",
    "/refund-policy"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const locationRoutes = areas.map((area) => ({
    url: `${baseUrl}/locations/${area.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const localSearchRoutes = areas.flatMap((area) =>
    categories.map((category) => ({
      url: `${baseUrl}/locations/${area.slug}/categories/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6
    }))
  );

  const businessRoutes = businesses.map((business) => ({
    url: `${baseUrl}/businesses/${business.slug}`,
    lastModified: business.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...locationRoutes,
    ...localSearchRoutes,
    ...businessRoutes
  ];
}

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL ?? "https://www.tradia.business").replace(/\/$/, "");
}
