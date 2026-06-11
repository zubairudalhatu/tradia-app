import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const publishedBusinessWhere = {
    listingStatus: "PUBLISHED" as const
  };
  const [categories, areas, categoryGroups, areaGroups, localGroups, businesses] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, slug: true }
    }),
    prisma.location.findMany({
      where: { isActive: true, type: "AREA" },
      select: { id: true, slug: true }
    }),
    prisma.business.groupBy({
      by: ["categoryId"],
      where: {
        ...publishedBusinessWhere,
        category: { isActive: true }
      },
      _max: { updatedAt: true }
    }),
    prisma.business.groupBy({
      by: ["locationId"],
      where: {
        ...publishedBusinessWhere,
        location: { isActive: true, type: "AREA" }
      },
      _max: { updatedAt: true }
    }),
    prisma.business.groupBy({
      by: ["locationId", "categoryId"],
      where: {
        ...publishedBusinessWhere,
        category: { isActive: true },
        location: { isActive: true, type: "AREA" }
      },
      _max: { updatedAt: true }
    }),
    prisma.business.findMany({
      where: publishedBusinessWhere,
      select: { slug: true, updatedAt: true }
    })
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const areaById = new Map(areas.map((area) => [area.id, area]));

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

  const categoryRoutes = categoryGroups.flatMap((group) => {
    const category = categoryById.get(group.categoryId);
    if (!category) return [];

    return [{
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: group._max.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }];
  });

  const locationRoutes = areaGroups.flatMap((group) => {
    const area = areaById.get(group.locationId);
    if (!area) return [];

    return [{
      url: `${baseUrl}/locations/${area.slug}`,
      lastModified: group._max.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }];
  });

  const localSearchRoutes = localGroups.flatMap((group) => {
    const area = areaById.get(group.locationId);
    const category = categoryById.get(group.categoryId);
    if (!area || !category) return [];

    return [{
      url: `${baseUrl}/locations/${area.slug}/categories/${category.slug}`,
      lastModified: group._max.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6
    }];
  });

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
  return (process.env.NEXTAUTH_URL ?? "https://www.tradiabusiness.com").replace(/\/$/, "");
}
