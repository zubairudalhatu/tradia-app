import { prisma } from "@/lib/db";
import { activePlacementWhere } from "@/lib/queries/featured";
import type { businessCreateSchema, businessProfileUpdateSchema } from "@/lib/validations/business";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";

const businessInclude = {
  category: true,
  location: true,
  plan: true,
  featuredPlacements: {
    where: activePlacementWhere()
  }
};

export type BusinessSearchFilters = {
  q?: string;
  category?: string;
  location?: string;
  verified?: boolean;
  open?: boolean;
  limit?: number;
  page?: number;
  rotate?: boolean;
};

export async function listPublishedBusinesses(filters: BusinessSearchFilters = {}) {
  const limit = clampResultLimit(filters.limit);
  const page = Math.max(filters.page ?? 1, 1);
  const where = buildPublishedBusinessWhere(filters);

  const businesses = await prisma.business.findMany({
    where,
    include: businessInclude,
    orderBy: [
      { featuredPlacements: { _count: "desc" } },
      { plan: { listingPriority: "desc" } },
      { verificationStatus: "desc" },
      { averageRating: "desc" },
      { createdAt: "desc" }
    ],
    ...(limit ? { take: limit, skip: (page - 1) * limit } : {})
  });

  return filters.rotate ? rotateBusinessResults(businesses) : businesses;
}

export function countPublishedBusinesses(filters: BusinessSearchFilters = {}) {
  return prisma.business.count({
    where: buildPublishedBusinessWhere(filters)
  });
}

export async function getPublicDirectoryStats() {
  const publishedWhere = { listingStatus: "PUBLISHED" as const };
  const [publishedBusinesses, verifiedBusinesses, locations, categories] = await Promise.all([
    prisma.business.count({ where: publishedWhere }),
    prisma.business.count({
      where: {
        ...publishedWhere,
        verificationStatus: "VERIFIED"
      }
    }),
    prisma.business.groupBy({
      by: ["locationId"],
      where: publishedWhere
    }),
    prisma.business.groupBy({
      by: ["categoryId"],
      where: publishedWhere
    })
  ]);

  return {
    publishedBusinesses,
    verifiedBusinesses,
    coveredLocations: locations.length,
    activeCategories: categories.length
  };
}

export function listFeaturedBusinesses(limit = 3) {
  return listRotatingFeaturedBusinesses(limit);
}

export async function listRotatingFeaturedBusinesses(limit = 3) {
  const candidates = await prisma.business.findMany({
    where: {
      listingStatus: "PUBLISHED",
      OR: [
        { featuredPlacements: { some: activePlacementWhere() } },
        { plan: { canBeFeatured: true } }
      ]
    },
    include: businessInclude,
    orderBy: [
      { featuredPlacements: { _count: "desc" } },
      { plan: { listingPriority: "desc" } },
      { verificationStatus: "desc" },
      { averageRating: "desc" },
      { viewCount: "desc" }
    ],
    take: Math.max(limit * 6, 12)
  });

  if (candidates.length <= limit) {
    return candidates;
  }

  const rotationSlot = Math.floor(Date.now() / (1000 * 60 * 60));
  const start = rotationSlot % candidates.length;
  const rotated = [...candidates.slice(start), ...candidates.slice(0, start)];

  return rotated.slice(0, limit);
}

export async function listPublishedBusinessCategories(filters: Pick<BusinessSearchFilters, "location"> = {}) {
  const groups = await prisma.business.groupBy({
    by: ["categoryId"],
    where: buildPublishedBusinessWhere(filters)
  });
  const categoryIds = groups.map((group) => group.categoryId);

  if (!categoryIds.length) return [];

  return prisma.category.findMany({
    where: {
      id: { in: categoryIds },
      isActive: true
    },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" }
    ]
  });
}

export async function listPublishedBusinessAreas(filters: Pick<BusinessSearchFilters, "category"> = {}) {
  const groups = await prisma.business.groupBy({
    by: ["locationId"],
    where: buildPublishedBusinessWhere(filters)
  });
  const locationIds = groups.map((group) => group.locationId);

  if (!locationIds.length) return [];

  return prisma.location.findMany({
    where: {
      id: { in: locationIds },
      isActive: true,
      type: "AREA"
    },
    orderBy: { name: "asc" }
  });
}

export function getBusinessBySlug(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      ...businessInclude,
      hours: true,
      media: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function createBusiness(input: z.infer<typeof businessCreateSchema>, ownerId?: string) {
  const slug = await uniqueBusinessSlug(input.name);
  const freePlan = await prisma.plan.findUnique({ where: { name: "Free" } });

  return prisma.business.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      categoryId: input.categoryId,
      locationId: input.locationId,
      address: input.address,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      website: input.website,
      ownerId,
      planId: freePlan?.id,
      listingStatus: "PENDING_REVIEW"
    },
    include: businessInclude
  });
}

export async function updateOwnedBusiness(
  businessId: string,
  ownerId: string,
  input: z.infer<typeof businessProfileUpdateSchema>
) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerId
    }
  });

  if (!business) {
    throw new Error("Business not found or not owned by current user.");
  }

  if (input.slug !== business.slug) {
    const existing = await prisma.business.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new Error("BUSINESS_SLUG_TAKEN");
    }
  }

  return prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      locationId: input.locationId,
      address: input.address,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      website: input.website
    },
    include: businessInclude
  });
}

async function uniqueBusinessSlug(name: string) {
  const base = slugify(name);
  let candidate = base;
  let counter = 2;

  while (await prisma.business.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "business";
}

function clampResultLimit(limit?: number) {
  if (!limit) return undefined;
  return Math.min(Math.max(limit, 1), 100);
}

function buildPublishedBusinessWhere(filters: BusinessSearchFilters = {}) {
  const search = filters.q?.trim();
  const openNow = filters.open ? getNigeriaBusinessTime() : null;

  return {
    listingStatus: "PUBLISHED",
    ...(filters.verified ? { verificationStatus: "VERIFIED" } : {}),
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.location ? { location: { slug: filters.location } } : {}),
    ...(openNow
      ? {
          hours: {
            some: {
              dayOfWeek: openNow.dayOfWeek,
              isClosed: false,
              opensAt: { lte: openNow.time },
              closesAt: { gte: openNow.time }
            }
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { category: { name: { contains: search, mode: "insensitive" } } },
            { location: { name: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  } satisfies Prisma.BusinessWhereInput;
}

function rotateBusinessResults<T>(businesses: T[]) {
  if (businesses.length <= 1) return businesses;

  const start = Math.floor(Math.random() * businesses.length);
  return [...businesses.slice(start), ...businesses.slice(0, start)];
}

function getNigeriaBusinessTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return {
    dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday),
    time: `${hour}:${minute}`
  };
}
