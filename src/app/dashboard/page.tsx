import Link from "next/link";
import { redirect } from "next/navigation";
import { isUserAccountVerified } from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { getBusinessProfileCompleteness } from "@/lib/profile-completeness";
import { updateLeadStatusAction } from "./actions";

type DashboardPageProps = {
  searchParams: Promise<{ submitted?: string; lead?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login");
  if (!isUserAccountVerified(user)) redirect("/verify-account");

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
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 3
      },
      media: {
        select: { id: true }
      },
      _count: {
        select: {
          contactLeads: true,
          reviews: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const analyticsBusinesses = businesses.filter((business) => getBusinessPlanState(business).benefits.analyticsEnabled);
  const recommendedBusiness = businesses
    .map((business) => ({
      business,
      percentage: getBusinessProfileCompleteness(business).percentage
    }))
    .sort((left, right) => left.percentage - right.percentage)[0]?.business;
  const totalViews = analyticsBusinesses.reduce((sum, business) => sum + business.viewCount, 0);
  const contactClicks = analyticsBusinesses.reduce((sum, business) => sum + business.contactClickCount, 0);
  const totalLeads = businesses.reduce((sum, business) => sum + business._count.contactLeads, 0);
  const publishedListings = businesses.filter((business) => business.listingStatus === "PUBLISHED").length;
  const verifiedListings = businesses.filter((business) => business.verificationStatus === "VERIFIED").length;
  const activePaidListings = businesses.filter((business) => {
    const planState = getBusinessPlanState(business);
    return Boolean(planState.activeSubscription && planState.benefits.name !== "Free");
  }).length;
  const totalReviews = businesses.reduce((sum, business) => sum + business._count.reviews, 0);
  const leadStatusCounts = businesses
    .flatMap((business) => business.contactLeads)
    .reduce<Record<string, number>>((counts, lead) => {
      counts[lead.status] = (counts[lead.status] ?? 0) + 1;
      return counts;
    }, {});

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Business Dashboard</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">Manage your Tradia profile</h1>
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
      <section className="mt-8 rounded-tradia border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-forest">Your next best step</p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              {businesses.length ? "Keep building customer trust" : "Publish your first business profile"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {businesses.length
                ? "Complete profiles give customers more reasons to trust, contact, and choose your business."
                : "Start free, add the essential business details, and submit your listing for review."}
            </p>
          </div>
          <Link
            href={recommendedBusiness ? `/dashboard/businesses/${recommendedBusiness.id}/edit` : "/businesses/new"}
            className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white"
          >
            {businesses.length ? "Continue Profile Setup" : "Add Your Business"}
          </Link>
        </div>
      </section>
      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        {[
          [String(businesses.length), "Your listings"],
          [String(publishedListings), "Published"],
          [String(verifiedListings), "Verified"],
          [String(activePaidListings), "Active paid plans"],
          [String(businesses.filter((business) => business.listingStatus === "PENDING_REVIEW").length), "Pending approval"],
          [analyticsBusinesses.length ? String(totalViews) : "Locked", "Profile views"],
          [analyticsBusinesses.length ? String(contactClicks) : "Locked", "Contact clicks"],
          [String(totalLeads), "Total enquiries"],
          [String(totalReviews), "Reviews"]
        ].map(([value, label]) => (
          <article key={label} className="rounded-tradia border border-slate-200 bg-white p-5">
            <strong className="block text-3xl font-black text-forest">{value}</strong>
            <span className="text-sm text-slate-600">{label}</span>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black">Lead pipeline</h2>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
            {["NEW", "CONTACTED", "CLOSED", "SPAM"].map((status) => (
              <div key={status} className="flex items-center justify-between rounded-tradia bg-slate-50 px-3 py-2">
                <span>{formatStatus(status)}</span>
                <strong className="text-ink">{leadStatusCounts[status] ?? 0}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black">Plan health</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {activePaidListings
              ? `${activePaidListings} business${activePaidListings === 1 ? " is" : "es are"} currently receiving paid-plan benefits.`
              : "No business is currently receiving paid-plan benefits."}
          </p>
          <Link href="/pricing" className="mt-4 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
            View Plans
          </Link>
        </article>
        <article className="rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black">Profile quality</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Complete profiles with verified status, recent photos, and fast enquiry follow-up earn more trust from visitors.
          </p>
          <Link href="/businesses/new" className="mt-4 inline-flex rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">
            Add Another Business
          </Link>
        </article>
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
            const completeness = getBusinessProfileCompleteness(business);
            const nextStep = completeness.missing[0];

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
                <div className="mt-4 rounded-tradia border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-ink">Profile launch checklist</h4>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {completeness.completed} of {completeness.total} trust-building steps complete
                      </p>
                    </div>
                    <strong className="text-2xl font-black text-forest">{completeness.percentage}%</strong>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${completeness.percentage}%` }}
                    />
                  </div>
                  {nextStep ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        <strong className="text-ink">Next:</strong> {nextStep}
                      </p>
                      <Link
                        href={`/dashboard/businesses/${business.id}/edit`}
                        className="rounded-tradia bg-white px-3 py-2 text-xs font-black text-forest shadow-sm"
                      >
                        Complete Next Step
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-bold text-forest">This profile is ready to promote.</p>
                      <Link
                        href={`/businesses/${business.slug}`}
                        className="rounded-tradia bg-white px-3 py-2 text-xs font-black text-forest shadow-sm"
                      >
                        View Public Profile
                      </Link>
                    </div>
                  )}
                  {completeness.missing.length > 1 ? (
                    <details className="mt-3 text-xs text-slate-600">
                      <summary className="cursor-pointer font-black text-ink">
                        View {completeness.missing.length - 1} more step{completeness.missing.length === 2 ? "" : "s"}
                      </summary>
                      <ul className="mt-2 grid gap-1 pl-4">
                        {completeness.missing.slice(1).map((item) => (
                          <li key={item} className="list-disc">{item}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
                {benefits.analyticsEnabled ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetricCard label="Views" value={business.viewCount} />
                    <MetricCard label="Contact clicks" value={business.contactClickCount} />
                    <MetricCard
                      label="Contact rate"
                      value={`${business.viewCount ? Math.round((business.contactClickCount / business.viewCount) * 100) : 0}%`}
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-tradia border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <strong className="block">Analytics are locked for this plan.</strong>
                    <span>Upgrade to a paid plan with analytics to see profile views, contact clicks, and performance signals.</span>
                  </div>
                )}
                {planState.isExpired ? (
                  <div className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <strong className="block">Your paid benefits have expired.</strong>
                    <span>Renew this business to restore premium visibility, verification eligibility, media limits, and analytics.</span>
                  </div>
                ) : null}
                {business.contactLeads.length ? (
                  <div className="mt-4 grid gap-2">
                    <h4 className="text-sm font-black text-ink">Recent enquiries</h4>
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
                {business.reviews.length ? (
                  <div className="mt-4 grid gap-2">
                    <h4 className="text-sm font-black text-ink">Recent reviews</h4>
                    {business.reviews.map((review) => (
                      <div key={review.id} className="rounded-tradia bg-slate-50 p-3 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-ink">{review.title ?? "Customer review"}</strong>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-ink">{review.status}</span>
                        </div>
                        <p className="mt-1">{review.rating}/5 - {review.body}</p>
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

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-tradia bg-slate-50 p-4">
      <strong className="block text-2xl font-black text-ink">{value}</strong>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
