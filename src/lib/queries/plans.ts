import { prisma } from "@/lib/db";

export async function listActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { annualPrice: "asc" }
  });

  return plans.map((plan) => {
    const features = plan.features as Record<string, unknown>;
    const featureList = [
      plan.name !== "Free" ? "Verification eligibility" : "Basic listing",
      `${plan.maxPhotos} photos`,
      features.analytics ? "Analytics included" : "Standard search placement",
      features.featured ? "Featured placement available" : "Normal placement"
    ];

    return { ...plan, featureList };
  });
}
