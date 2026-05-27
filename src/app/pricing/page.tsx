import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listActivePlans } from "@/lib/queries/plans";
import { startPlanCheckoutAction } from "./actions";

type PricingPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export const dynamic = "force-dynamic";

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [plans, user, params] = await Promise.all([
    listActivePlans(),
    getCurrentUser(),
    searchParams
  ]);
  const businesses = user
    ? await prisma.business.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Plans</p>
      <h1 className="text-5xl font-black tracking-normal">Start free, upgrade for trust and visibility</h1>
      {params.checkout ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {checkoutMessage(params.checkout)}
        </p>
      ) : null}
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-black">{plan.name}</h2>
            <p className="mt-2 text-3xl font-black text-forest">N{plan.annualPrice.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500">per year</p>
            <ul className="mt-5 grid gap-3 text-sm text-slate-600">
              {plan.featureList.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.annualPrice > 0 ? (
              user ? (
                businesses.length ? (
                  <form action={startPlanCheckoutAction} className="mt-6 grid gap-3">
                    <input type="hidden" name="planId" value={plan.id} />
                    <select className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="businessId" required>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>{business.name}</option>
                      ))}
                    </select>
                    <button name="paymentProvider" value="squad" className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                      Upgrade with Squad
                    </button>
                  </form>
                ) : (
                  <Link className="mt-6 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/businesses/new">
                    Add Business First
                  </Link>
                )
              ) : (
                <Link className="mt-6 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/login">
                  Sign In to Upgrade
                </Link>
              )
            ) : null}
          </article>
        ))}
      </section>
    </main>
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

  return "Checkout could not be started. Please try again.";
}
