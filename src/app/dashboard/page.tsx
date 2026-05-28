import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { updateLeadStatusAction } from "./actions";

type DashboardPageProps = {
  searchParams: Promise<{ submitted?: string; lead?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login");

  const businesses = await prisma.business.findMany({
    where: { ownerId: user.id },
    include: {
      category: true,
      location: true,
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      },
      contactLeads: {
        orderBy: { createdAt: "desc" },
        take: 3
      },
      _count: {
        select: {
          contactLeads: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const analyticsBusinesses = businesses.filter((business) => getBusinessPlanState(business).benefits.analyticsEnabled);
  const totalViews = analyticsBusinesses.reduce((sum, business) => sum + business.viewCount, 0);
  const contactClicks = analyticsBusinesses.reduce((sum, business) => sum + business.contactClickCount, 0);
  const totalLeads = businesses.reduce((sum, business) => sum + business._count.contactLeads, 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Business Dashboard</p>
      <h1 className="text-5xl font-black tracking-normal">Manage your Tradia profile</h1>
      {params.submitted ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Your business has been submitted and is waiting for admin approval.
        </p>
      ) : null}
      {params.lead === "updated" ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Enquiry status updated.
        </p>
      ) : null}
      <section className="mt-8 grid gap-4 lg:grid-cols-5">
        {[
          [String(businesses.length), "Your listings"],
          [String(businesses.filter((business) => business.listingStatus === "PENDING_REVIEW").length), "Pending approval"],
          [analyticsBusinesses.length ? String(totalViews) : "Locked", "Profile views"],
          [analyticsBusinesses.length ? String(contactClicks) : "Locked", "Contact clicks"],
          [String(totalLeads), "Recent enquiries"]
        ].map(([value, label]) => (
          <article key={label} className="rounded-tradia border border-slate-200 bg-white p-5">
            <strong className="block text-3xl font-black text-forest">{value}</strong>
            <span className="text-sm text-slate-600">{label}</span>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-2xl font-black">Your businesses</h2>
            <p className="mt-1 text-sm text-slate-600">Track approval, verification, views, and profile status.</p>
          </div>
          <Link href="/businesses/new" className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
            Add Business
          </Link>
        </div>
        <div className="divide-y divide-slate-200">
          {businesses.length ? businesses.map((business) => {
            const planState = getBusinessPlanState(business);
            const benefits = planState.benefits;

            return (
            <article key={business.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-lg font-black">{business.name}</h3>
                <p className="text-sm text-slate-600">
                  {business.category.name} in {business.location.name} - {business.listingStatus.replace("_", " ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{benefits.name} plan</span>
                  {planState.activeSubscription ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-forest">
                      Active until {planState.activeSubscription.endsAt.toLocaleDateString()}
                    </span>
                  ) : null}
                  {planState.isExpired ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Subscription expired</span>
                  ) : null}
                  {benefits.analyticsEnabled ? (
                    <>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{business.viewCount} views</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{business.contactClickCount} contact clicks</span>
                    </>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">Analytics locked</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-3 py-1">{business._count.contactLeads} enquiries</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{business.reviewCount} reviews</span>
                </div>
                {business.contactLeads.length ? (
                  <div className="mt-4 grid gap-2">
                    {business.contactLeads.map((lead) => (
                      <div key={lead.id} className="rounded-tradia bg-slate-50 p-3 text-sm text-slate-600">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <strong className="block text-ink">{lead.name}</strong>
                            <span>{lead.email ?? lead.phone ?? "No contact"} - {lead.message}</span>
                            <span className="mt-2 block text-xs font-black text-slate-500">Status: {lead.status}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {["CONTACTED", "CLOSED", "SPAM"].map((status) => (
                              <form key={status} action={updateLeadStatusAction}>
                                <input type="hidden" name="leadId" value={lead.id} />
                                <input type="hidden" name="status" value={status} />
                                <button className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink shadow-sm" disabled={lead.status === status}>
                                  {status.toLowerCase()}
                                </button>
                              </form>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-ink">
                  {business.verificationStatus}
                </span>
                <Link
                  href={`/dashboard/businesses/${business.id}/edit`}
                  className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white"
                >
                  Edit
                </Link>
              </div>
            </article>
            );
          }) : (
            <p className="p-5 text-sm text-slate-600">You have not submitted a business yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
