import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const suffix = Date.now();
  const email = `smoke-owner-${suffix}@example.com`;
  const businessSlug = `smoke-approval-test-${suffix}`;

  const [category, location, plan] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { slug: "services" } }),
    prisma.location.findFirstOrThrow({ where: { slug: "kano-municipal", type: "AREA" } }),
    prisma.plan.findUniqueOrThrow({ where: { name: "Free" } })
  ]);

  const owner = await prisma.user.create({
    data: {
      name: "Smoke Test Owner",
      email,
      phone: `+23491${String(suffix).slice(-8)}`,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Smoke Approval Test ${suffix}`,
      slug: businessSlug,
      description: "Temporary test listing for the Tradia submission and admin approval loop.",
      categoryId: category.id,
      locationId: location.id,
      address: "Kano Municipal, Kano",
      whatsapp: "+2349055091300",
      phone: "+2349055091300",
      planId: plan.id,
      listingStatus: "PENDING_REVIEW"
    }
  });

  const pending = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
  if (pending.listingStatus !== "PENDING_REVIEW") {
    throw new Error("Business was not created as pending review.");
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { listingStatus: "PUBLISHED" }
  });

  const published = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
  if (published.listingStatus !== "PUBLISHED") {
    throw new Error("Business was not approved/published.");
  }

  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.delete({ where: { id: owner.id } });

  console.log("Smoke operating loop passed:", {
    submitted: "PENDING_REVIEW",
    approved: "PUBLISHED"
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
