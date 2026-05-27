import { prisma } from "@/lib/db";

export function listActiveAreas() {
  return prisma.location.findMany({
    where: {
      isActive: true,
      type: "AREA"
    },
    orderBy: { name: "asc" }
  });
}

export function listActiveStateAreaGroups() {
  return prisma.location.findMany({
    where: {
      isActive: true,
      type: "STATE"
    },
    include: {
      children: {
        where: {
          isActive: true,
          type: "AREA"
        },
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });
}

export function getActiveAreaBySlug(slug: string) {
  return prisma.location.findFirst({
    where: {
      slug,
      isActive: true,
      type: "AREA"
    }
  });
}
