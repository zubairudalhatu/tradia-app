import { addYears } from "@/lib/time";
import { prisma } from "@/lib/db";

export function activePlacementWhere(now = new Date()) {
  return {
    status: "ACTIVE",
    startsAt: { lte: now },
    endsAt: { gte: now }
  };
}

export async function createHomepagePlacement(businessId: string) {
  const now = new Date();

  return prisma.featuredPlacement.create({
    data: {
      businessId,
      placementType: "HOMEPAGE",
      startsAt: now,
      endsAt: addYears(now, 1),
      status: "ACTIVE"
    }
  });
}

export async function deactivateBusinessPlacements(businessId: string) {
  return prisma.featuredPlacement.updateMany({
    where: {
      businessId,
      status: "ACTIVE"
    },
    data: {
      status: "INACTIVE"
    }
  });
}
