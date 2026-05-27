import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { refreshBusinessRating } from "../src/lib/ratings";

const prisma = new PrismaClient();

async function main() {
  const suffix = Date.now();
  const [category, location, plan] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { slug: "services" } }),
    prisma.location.findFirstOrThrow({ where: { slug: "kano-municipal", type: "AREA" } }),
    prisma.plan.findUniqueOrThrow({ where: { name: "Free" } })
  ]);

  const owner = await prisma.user.create({
    data: {
      name: "Review Smoke Owner",
      email: `review-owner-${suffix}@example.com`,
      phone: `+23493${String(suffix).slice(-8)}`,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });
  const reviewer = await prisma.user.create({
    data: {
      name: "Review Smoke Customer",
      email: `review-customer-${suffix}@example.com`,
      phone: `+23494${String(suffix).slice(-8)}`,
      role: "USER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Review Smoke ${suffix}`,
      slug: `review-smoke-${suffix}`,
      description: "Temporary test listing for review moderation workflow.",
      categoryId: category.id,
      locationId: location.id,
      address: "Kano Municipal, Kano",
      whatsapp: "+2349055091300",
      phone: "+2349055091300",
      planId: plan.id,
      listingStatus: "PUBLISHED"
    }
  });

  const review = await prisma.review.create({
    data: {
      businessId: business.id,
      userId: reviewer.id,
      rating: 5,
      title: "Excellent service",
      body: "The service was clear, fast, and professional.",
      status: "PENDING"
    }
  });

  await prisma.review.update({ where: { id: review.id }, data: { status: "PUBLISHED" } });
  await refreshBusinessRating(business.id);

  await prisma.review.update({
    where: { id: review.id },
    data: {
      ownerResponse: "Thank you for the thoughtful review.",
      ownerRespondedAt: new Date()
    }
  });

  const report = await prisma.report.create({
    data: {
      reporterId: reviewer.id,
      businessId: business.id,
      reviewId: review.id,
      type: "Review report",
      message: "Smoke test report message."
    }
  });

  await prisma.report.update({
    where: { id: report.id },
    data: { status: "RESOLVED", resolvedBy: "system-seed-user", resolvedAt: new Date() }
  });

  const checked = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    include: { reviews: true, reports: true }
  });

  if (checked.reviewCount !== 1 || Number(checked.averageRating) !== 5) {
    throw new Error("Review rating recalculation failed.");
  }

  await prisma.report.deleteMany({ where: { businessId: business.id } });
  await prisma.review.deleteMany({ where: { businessId: business.id } });
  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, reviewer.id] } } });

  console.log("Smoke reviews passed:", {
    review: "PUBLISHED",
    rating: "5.0",
    ownerResponse: "saved",
    report: "RESOLVED"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
