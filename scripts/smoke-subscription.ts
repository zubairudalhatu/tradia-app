import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { activateSubscriptionFromPayment } from "../src/lib/payments/subscriptions";

const prisma = new PrismaClient();

async function main() {
  const suffix = Date.now();
  const [category, location, freePlan, silverPlan] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { slug: "services" } }),
    prisma.location.findFirstOrThrow({ where: { slug: "kano-municipal", type: "AREA" } }),
    prisma.plan.findUniqueOrThrow({ where: { name: "Free" } }),
    prisma.plan.findUniqueOrThrow({ where: { name: "Silver" } })
  ]);

  const owner = await prisma.user.create({
    data: {
      name: "Subscription Smoke Owner",
      email: `subscription-smoke-${suffix}@example.com`,
      phone: `+23495${String(suffix).slice(-8)}`,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash("Password2026!", 12)
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Subscription Smoke ${suffix}`,
      slug: `subscription-smoke-${suffix}`,
      description: "Temporary test listing for Paystack subscription activation.",
      categoryId: category.id,
      locationId: location.id,
      address: "Kano Municipal, Kano",
      whatsapp: "+2349055091300",
      phone: "+2349055091300",
      planId: freePlan.id,
      listingStatus: "PUBLISHED"
    }
  });

  const reference = `smoke_${suffix}`;
  await prisma.payment.create({
    data: {
      userId: owner.id,
      businessId: business.id,
      provider: "paystack",
      providerReference: reference,
      amount: silverPlan.annualPrice,
      currency: "NGN",
      status: "PENDING",
      rawPayload: {
        planId: silverPlan.id,
        businessId: business.id,
        userId: owner.id,
        kind: "subscription"
      }
    }
  });

  await activateSubscriptionFromPayment({
    reference,
    amount: silverPlan.annualPrice,
    currency: "NGN",
    paidAt: new Date(),
    rawPayload: { event: "smoke.subscription" }
  });

  const upgraded = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    include: { plan: true, subscriptions: true, payments: true }
  });

  if (upgraded.plan?.name !== "Silver" || upgraded.subscriptions.length !== 1 || upgraded.payments[0].status !== "SUCCESS") {
    throw new Error("Subscription smoke workflow failed.");
  }

  await prisma.payment.deleteMany({ where: { businessId: business.id } });
  await prisma.subscription.deleteMany({ where: { businessId: business.id } });
  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.delete({ where: { id: owner.id } });

  console.log("Smoke subscription passed:", {
    payment: "SUCCESS",
    plan: "Silver",
    subscription: "ACTIVE"
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
