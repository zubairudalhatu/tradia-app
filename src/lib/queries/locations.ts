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

export async function listActiveStateSelections() {
  const states = await prisma.location.findMany({
    where: {
      isActive: true,
      type: "STATE"
    },
    include: {
      children: {
        where: {
          isActive: true,
          type: "AREA",
          slug: { endsWith: "-statewide" }
        },
        orderBy: { name: "asc" },
        take: 1
      }
    },
    orderBy: { name: "asc" }
  });

  return states.flatMap((state) => state.children.map((area) => ({
    id: area.id,
    slug: area.slug,
    stateId: state.id,
    name: state.name === "Federal Capital Territory" ? "Federal Capital Territory (FCT)" : state.name
  })));
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
