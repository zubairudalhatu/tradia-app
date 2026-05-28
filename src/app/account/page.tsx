import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { addDays } from "@/lib/time";
import { updateAccountAction } from "./actions";

type AccountPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login?next=/account");

  const businesses = await prisma.business.findMany({
    where: { ownerId: user.id },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    include: {
      business: true,
      subscription: {
        include: { plan: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const renewalWindowEndsAt = addDays(new Date(), 30);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-5xl font-black tracking-normal">Your profile</h1>
      <p className="mt-4 text-lg text-slate-600">
        Keep your contact details current so Tradia can connect listings, reviews, and verification activity to the right person.
      </p>

      {params.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Profile updated.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {params.error === "phone" ? "That phone number is already used by another account." : "Please enter a valid name."}
        </p>
      ) : null}

      <form action={updateAccountAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Full name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={user.name} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 bg-slate-50 px-4 py-3" value={user.email} disabled />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" defaultValue={user.phone ?? ""} placeholder="+234..." />
        </label>
        <div className="rounded-tradia bg-slate-50 p-4 text-sm text-slate-600">
          <strong className="text-ink">Account role:</strong> {user.role.replace("_", " ")}
        </div>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Save Profile</button>
      </form>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Plan and renewal status</h2>
          <p className="mt-1 text-sm text-slate-600">Track paid plan access for each business you manage.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {businesses.length ? businesses.map((business) => {
            const planState = getBusinessPlanState(business);
            const activeSubscription = planState.activeSubscription;
            const expiresSoon = Boolean(activeSubscription && activeSubscription.endsAt <= renewalWindowEndsAt);

            return (
              <article key={business.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{business.name}</h3>
                  <p className="text-sm text-slate-600">
                    {planState.benefits.name} plan
                    {activeSubscription ? ` - active until ${activeSubscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}` : ""}
                  </p>
                  {expiresSoon ? (
                    <p className="mt-2 text-sm font-bold text-amber-800">This plan is due for renewal soon.</p>
                  ) : null}
                  {planState.isExpired ? (
                    <p className="mt-2 text-sm font-bold text-red-700">This paid plan has expired. Free plan benefits now apply.</p>
                  ) : null}
                </div>
                <Link className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/pricing">
                  View Plans
                </Link>
              </article>
            );
          }) : (
            <p className="p-5 text-sm text-slate-600">No businesses are attached to this account yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Payment history</h2>
          <p className="mt-1 text-sm text-slate-600">Recent subscription payments connected to this account.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {payments.length ? payments.map((payment) => (
            <article key={payment.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-black">
                  {payment.subscription?.plan.name ?? "Plan payment"} - {formatAmount(payment.amount, payment.currency)}
                </h3>
                <p className="text-sm text-slate-600">
                  {payment.business?.name ?? "Business"} - {payment.provider} - {payment.status}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Reference: {payment.providerReference} - {payment.paidAt ? payment.paidAt.toLocaleDateString("en-NG", { dateStyle: "medium" }) : payment.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${payment.status === "SUCCESS" ? "bg-emerald-50 text-forest" : "bg-slate-100 text-ink"}`}>
                  {payment.status}
                </span>
                {payment.status === "SUCCESS" ? (
                  <Link className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/account/payments/${payment.id}/receipt`}>
                    Receipt
                  </Link>
                ) : null}
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No payments have been recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
