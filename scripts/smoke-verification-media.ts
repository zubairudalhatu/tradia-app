import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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
      name: "Verification Smoke Owner",
      email: `verification-smoke-${suffix}@example.com`,
      phone: `+23492${String(suffix).slice(-8)}`,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Verification Smoke ${suffix}`,
      slug: `verification-smoke-${suffix}`,
      description: "Temporary test listing for media and verification workflow.",
      categoryId: category.id,
      locationId: location.id,
      address: "Kano Municipal, Kano",
      whatsapp: "+2349055091300",
      phone: "+2349055091300",
      planId: plan.id,
      listingStatus: "PUBLISHED"
    }
  });

  await prisma.media.create({
    data: {
      businessId: business.id,
      userId: owner.id,
      type: "LOGO",
      url: "/uploads/smoke/logo.png",
      title: "Smoke logo"
    }
  });

  const request = await prisma.verificationRequest.create({
    data: {
      businessId: business.id,
      submittedBy: owner.id,
      documentType: "CAC Certificate",
      documentUrl: "/uploads/smoke/cac.pdf",
      status: "PENDING"
    }
  });

  await prisma.verificationRequest.update({
    where: { id: request.id },
    data: { status: "APPROVED", reviewedBy: "system-seed-user", reviewedAt: new Date() }
  });
  await prisma.business.update({
    where: { id: business.id },
    data: { verificationStatus: "VERIFIED" }
  });

  const verified = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    include: { media: true, verificationRequests: true }
  });

  if (verified.verificationStatus !== "VERIFIED" || verified.media.length !== 1) {
    throw new Error("Media and verification smoke workflow failed.");
  }

  await prisma.verificationRequest.deleteMany({ where: { businessId: business.id } });
  await prisma.media.deleteMany({ where: { businessId: business.id } });
  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.delete({ where: { id: owner.id } });

  console.log("Smoke media verification passed:", {
    media: "created",
    verification: "APPROVED",
    business: "VERIFIED"
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
