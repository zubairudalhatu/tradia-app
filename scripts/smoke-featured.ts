import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createHomepagePlacement, deactivateBusinessPlacements } from "../src/lib/queries/featured";

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
      name: "Featured Smoke Owner",
      email: `featured-smoke-${suffix}@example.com`,
      phone: `+23496${String(suffix).slice(-8)}`,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Featured Smoke ${suffix}`,
      slug: `featured-smoke-${suffix}`,
      description: "Temporary test listing for featured placement workflow.",
      categoryId: category.id,
      locationId: location.id,
      address: "Kano Municipal, Kano",
      whatsapp: "+2349055091300",
      phone: "+2349055091300",
      planId: plan.id,
      listingStatus: "PUBLISHED"
    }
  });

  await createHomepagePlacement(business.id);
  const featured = await prisma.featuredPlacement.findFirstOrThrow({
    where: { businessId: business.id, status: "ACTIVE" }
  });

  await deactivateBusinessPlacements(business.id);
  const inactive = await prisma.featuredPlacement.findUniqueOrThrow({
    where: { id: featured.id }
  });

  if (inactive.status !== "INACTIVE") {
    throw new Error("Featured placement was not deactivated.");
  }

  await prisma.featuredPlacement.deleteMany({ where: { businessId: business.id } });
  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.delete({ where: { id: owner.id } });

  console.log("Smoke featured passed:", {
    placement: "ACTIVE",
    removal: "INACTIVE"
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
