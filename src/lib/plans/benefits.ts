type PlanBenefitInput = {
  name: string;
  annualPrice: number;
  maxPhotos: number;
  canBeFeatured: boolean;
  analyticsEnabled: boolean;
} | null;

export function getPlanBenefits(plan: PlanBenefitInput) {
  return {
    name: plan?.name ?? "Free",
    maxPhotos: plan?.maxPhotos ?? 3,
    canBeFeatured: Boolean(plan?.canBeFeatured),
    analyticsEnabled: Boolean(plan?.analyticsEnabled),
    canRequestVerification: Boolean(plan && plan.annualPrice > 0)
  };
}

export function isPhotoMediaType(type: string) {
  return ["LOGO", "COVER", "GALLERY"].includes(type);
}
