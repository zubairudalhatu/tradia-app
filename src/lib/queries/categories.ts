import { prisma } from "@/lib/db";

export function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
}

export function getActiveCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true
    }
  });
}
