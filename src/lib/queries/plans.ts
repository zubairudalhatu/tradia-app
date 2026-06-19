import { prisma } from "@/lib/db";

export async function listActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { annualPrice: "asc" }
  });

  return plans.map((plan) => {
    const featureList = [
      plan.name !== "Free" ? "Verification eligibility" : "Basic listing",
      `${plan.maxPhotos} photos`,
      plan.analyticsEnabled ? "Analytics included" : "Standard search placement",
      plan.canBeFeatured ? "Featured placement available" : "Normal placement",
      plan.profilePdfEnabled ? "Public company profile PDF" : null
    ].filter((feature): feature is string => Boolean(feature));

    return { ...plan, featureList };
  });
}
