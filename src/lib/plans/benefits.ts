type PlanBenefitInput = {
  id?: string;
  name: string;
  annualPrice: number;
  maxPhotos: number;
  canBeFeatured: boolean;
  analyticsEnabled: boolean;
} | null;

type SubscriptionInput = {
  status: string;
  startsAt: Date;
  endsAt: Date;
  plan: NonNullable<PlanBenefitInput>;
};

type BusinessPlanInput = {
  plan: PlanBenefitInput;
  subscriptions?: SubscriptionInput[];
};

export function getPlanBenefits(plan: PlanBenefitInput) {
  return {
    name: plan?.name ?? "Free",
    maxPhotos: plan?.maxPhotos ?? 3,
    canBeFeatured: Boolean(plan?.canBeFeatured),
    analyticsEnabled: Boolean(plan?.analyticsEnabled),
    canRequestVerification: Boolean(plan && plan.annualPrice > 0)
  };
}

export function getBusinessPlanState(business: BusinessPlanInput, now = new Date()) {
  const subscriptions = business.subscriptions ?? [];
  const activeSubscription = subscriptions
    .filter((subscription) => subscription.status === "ACTIVE" && subscription.endsAt > now)
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  const hasSubscriptionHistory = subscriptions.length > 0;
  const effectivePlan = activeSubscription?.plan ?? (hasSubscriptionHistory && (business.plan?.annualPrice ?? 0) > 0 ? null : business.plan);
  const expiredSubscription = !activeSubscription
    ? subscriptions
        .filter((subscription) => (subscription.status === "ACTIVE" && subscription.endsAt <= now) || subscription.status === "EXPIRED")
        .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0]
    : undefined;

  return {
    plan: effectivePlan,
    benefits: getPlanBenefits(effectivePlan),
    activeSubscription,
    expiredSubscription,
    isExpired: Boolean(expiredSubscription && !activeSubscription)
  };
}

export function isPhotoMediaType(type: string) {
  return ["LOGO", "COVER", "GALLERY"].includes(type);
}
