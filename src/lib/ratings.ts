import { prisma } from "@/lib/db";

export async function refreshBusinessRating(businessId: string) {
  const aggregate = await prisma.review.aggregate({
    where: {
      businessId,
      status: "PUBLISHED"
    },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.business.update({
    where: { id: businessId },
    data: {
      averageRating: aggregate._avg.rating?.toFixed(1) ?? "0",
      reviewCount: aggregate._count.rating
    }
  });
}
