import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { listActivePlans } from "@/lib/queries/plans";
import { formatNaira as formatWalletNaira, walletProducts } from "@/lib/wallet/products";
import { startPlanCheckoutAction } from "./actions";

type PricingPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List Your Business in Nigeria | Tradia Pricing",
  description: "List your business online in Nigeria with Tradia. Start free or upgrade for verification eligibility, more photos, analytics, and stronger SME visibility.",
  alternates: {
    canonical: "/pricing"
  },
  keywords: [
    "list your business in Nigeria",
    "free business listing Nigeria",
    "business listing website Nigeria",
    "promote my business in Nigeria",
    "online visibility for SMEs in Nigeria",
    "advertise my business in Nigeria",
    "SME visibility platform Nigeria"
  ],
  openGraph: {
    title: "List Your Business in Nigeria with Tradia",
    description: "Create a business profile, improve visibility, request verification, add photos, and reach customers across Nigeria.",
    url: "/pricing",
    type: "website"
  }
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [plans, user, params] = await Promise.all([
    listActivePlans(),
    getCurrentUser(),
    searchParams
  ]);
  const businesses = user
    ? await prisma.business.findMany({
        where: { ownerId: user.id },
        include: {
          plan: true,
          subscriptions: {
            include: { plan: true },
            orderBy: { endsAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Plans</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">Start free, upgrade for trust and visibility</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
        Create a free listing, then upgrade when your business needs more photos, analytics,
        stronger placement, and eligibility for Tradia verification review. Paid plans improve
        visibility tools; verification is still reviewed separately by admins.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <PricingBenefit
          title="Trust signals customers notice"
          body="Paid profiles can request verification review, add richer media, and show more evidence before customers call."
        />
        <PricingBenefit
          title="More room to tell your story"
          body="Upload more photos, show a proper cover, and keep your public profile looking active and credible."
        />
        <PricingBenefit
          title="Launch add-ons with wallet funds"
          body="Top up once, then pay for featured placement, starter kits, and verified-business support from your Tradia wallet."
        />
      </section>
      {params.checkout ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {checkoutMessage(params.checkout)}
        </p>
      ) : null}
      <section className="mt-8 grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const businessesWithPlanState = businesses.map((business) => ({
            business,
            planState: getBusinessPlanState(business)
          }));
          const businessesEligibleForPlan = businessesWithPlanState.filter(({ planState }) => (planState.plan?.annualPrice ?? 0) < plan.annualPrice);
          const businessesOnPlan = businessesWithPlanState.filter(({ planState }) => planState.plan?.id === plan.id);
          const businessesAbovePlan = businessesWithPlanState.filter(({ planState }) => (planState.plan?.annualPrice ?? 0) > plan.annualPrice);
          const isCurrentForAnyBusiness = businessesOnPlan.length > 0;
          const isIncludedForAllBusinesses = businesses.length > 0 && businessesEligibleForPlan.length === 0 && businessesAbovePlan.length > 0;

          return (
          <article
            key={plan.name}
            className={`min-w-0 overflow-hidden rounded-tradia border bg-white p-5 shadow-sm ${
              isCurrentForAnyBusiness ? "border-forest ring-2 ring-emerald-100" : "border-slate-200"
            }`}
          >
            <h2 className="text-xl font-black">{plan.name}</h2>
            {isCurrentForAnyBusiness ? (
              <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-forest">
                Current plan
              </p>
            ) : null}
            {businessesOnPlan.length ? (
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600">
                {businessesOnPlan.map(({ business, planState }) => (
                  <p key={business.id} className="break-words rounded-tradia bg-emerald-50 px-3 py-2 text-forest">
                    {business.name}
                    {planState.activeSubscription ? ` active until ${planState.activeSubscription.endsAt.toLocaleDateString()}` : ""}
                  </p>
                ))}
              </div>
            ) : null}
            {isIncludedForAllBusinesses ? (
              <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-ink">
                Included in higher plan
              </p>
            ) : null}
            <p className="mt-2 text-3xl font-black text-forest">{formatNaira(plan.annualPrice)}</p>
            <p className="mt-1 text-sm text-slate-500">per year</p>
            <ul className="mt-5 grid gap-3 text-sm text-slate-600">
              {plan.featureList.map((feature) => (
                <li key={feature}>{pricingFeatureLabel(feature)}</li>
              ))}
              {extraPlanBenefits(plan.name).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.annualPrice > 0 ? (
              <p className="mt-5 rounded-tradia bg-emerald-50 p-3 text-xs font-bold leading-5 text-forest">
                Verification eligibility means this plan can request admin review; it is not automatic approval.
              </p>
            ) : (
              <p className="mt-5 rounded-tradia bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                Best for getting listed and testing your public profile before upgrading.
              </p>
            )}
            {plan.annualPrice > 0 ? (
              user ? (
                businesses.length ? (
                  businessesEligibleForPlan.length ? (
                    <form action={startPlanCheckoutAction} className="mt-6 grid min-w-0 gap-3">
                      <input type="hidden" name="planId" value={plan.id} />
                      <select className="block w-full min-w-0 max-w-full truncate rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="businessId" required>
                        {businessesEligibleForPlan.map(({ business, planState }) => (
                          <option key={business.id} value={business.id}>
                            {business.name} - currently {planState.benefits.name}
                          </option>
                        ))}
                      </select>
                      <button name="paymentProvider" value="squad" className="w-full rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                        Upgrade with Squad
                      </button>
                    </form>
                  ) : (
                    <div className="mt-6 rounded-tradia bg-slate-50 p-4 text-sm font-bold text-slate-600">
                      {isCurrentForAnyBusiness ? "This plan is already active for your business." : "Your business already has this plan benefit or better."}
                    </div>
                  )
                ) : (
                  <Link className="mt-6 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/businesses/new">
                    List Your Business Free
                  </Link>
                )
              ) : (
                <Link className="mt-6 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/login">
                  Sign In to Upgrade
                </Link>
              )
            ) : null}
          </article>
        );
        })}
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-extrabold uppercase text-ember">Wallet add-ons</p>
            <h2 className="mt-1 text-3xl font-black tracking-normal">Pay for campaign items without starting a new subscription.</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Use the Tradia wallet for one-off business growth items like homepage featuring, launch support, and verified-business promotion kits.
            </p>
            <Link href="/account" className="mt-5 inline-flex rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">
              Fund Wallet
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {walletProducts.map((product) => (
              <article key={product.code} className="rounded-tradia border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-black">{product.name}</h3>
                <p className="mt-2 text-2xl font-black text-forest">{formatWalletNaira(product.price)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
                {product.requiresVerified ? (
                  <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-forest">
                    Verified businesses
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingBenefit({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function checkoutMessage(status: string) {
  if (status === "squad-not-configured") {
    return "Squad checkout is not configured yet. Please confirm SQUAD_SECRET_KEY and SQUAD_ENVIRONMENT in Vercel, then redeploy.";
  }

  if (status === "squad-provider-error") {
    return "Squad rejected the checkout request. Please confirm the Squad secret key matches the selected environment, then try again.";
  }

  if (status === "invalid") {
    return "Checkout could not be started. Please confirm you selected one of your businesses.";
  }

  if (status === "failed") {
    return "Checkout could not be started by the payment provider. Please try again or choose another provider.";
  }

  if (status === "current-plan") {
    return "This business already has that plan or a higher plan. Please choose a higher upgrade option.";
  }

  return "Checkout could not be started. Please try again.";
}

function formatNaira(amount: number) {
  if (amount === 0) return "Free";

  return `NGN ${amount.toLocaleString("en-NG")}`;
}

function pricingFeatureLabel(feature: string) {
  if (feature.toLowerCase() === "verification eligibility") {
    return "Eligible to request Tradia verification review";
  }

  return feature;
}

function extraPlanBenefits(planName: string) {
  if (planName === "Free") {
    return [
      "Claimable public business profile",
      "Customer phone, WhatsApp, email, and website links"
    ];
  }

  if (planName === "Silver") {
    return [
      "Better launch-ready profile capacity",
      "Good fit for first-time online visibility"
    ];
  }

  if (planName === "Gold") {
    return [
      "Eligible for homepage feature campaigns",
      "Stronger media capacity for products, services, and proof"
    ];
  }

  if (planName === "Platinum") {
    return [
      "Best fit for multi-photo business showcases",
      "Priority-ready profile for launch campaigns and wallet add-ons"
    ];
  }

  return [];
}
