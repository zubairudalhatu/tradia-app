import { redirect } from "next/navigation";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { addDays } from "@/lib/time";
import type { Prisma } from "@prisma/client";
import {
  approveBusinessAction,
  approveVerificationAction,
  dismissReportAction,
  featureBusinessAction,
  publishReviewAction,
  rejectReviewAction,
  rejectBusinessAction,
  rejectVerificationAction,
  removeReviewAction,
  resolveReportAction,
  unfeatureBusinessAction,
  updateAdminLeadStatusAction
} from "./actions";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    userSearch?: string;
    businessSearch?: string;
    listingStatus?: string;
    verificationStatus?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");
  const adminActionToken = createAdminActionToken(user);
  const now = new Date();
  const renewalWindowEndsAt = addDays(now, 30);
  const userSearch = params.userSearch?.trim();
  const businessSearch = params.businessSearch?.trim();
  const userWhere: Prisma.UserWhereInput = userSearch
    ? {
        OR: [
          { name: { contains: userSearch, mode: "insensitive" } },
          { email: { contains: userSearch, mode: "insensitive" } },
          { phone: { contains: userSearch, mode: "insensitive" } }
        ]
      }
    : {};
  const businessWhere: Prisma.BusinessWhereInput = {
    ...(businessSearch
      ? {
          OR: [
            { name: { contains: businessSearch, mode: "insensitive" } },
            { description: { contains: businessSearch, mode: "insensitive" } },
            { address: { contains: businessSearch, mode: "insensitive" } },
            { owner: { name: { contains: businessSearch, mode: "insensitive" } } },
            { owner: { email: { contains: businessSearch, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(isListingStatus(params.listingStatus) ? { listingStatus: params.listingStatus } : {}),
    ...(isVerificationStatus(params.verificationStatus) ? { verificationStatus: params.verificationStatus } : {})
  };

  const [
    pendingListings,
    verificationRequests,
    reports,
    publishedListings,
    pendingBusinesses,
    pendingVerificationRequests,
    pendingReviews,
    openReports,
    publishedBusinesses,
    recentUsers,
    recentBusinesses,
    recentAuditLogs,
    recentLeads,
    newLeads,
    expiringSubscriptionCount,
    expiredSubscriptionCount,
    expiringSubscriptions,
    expiredSubscriptions
  ] = await Promise.all([
    prisma.business.count({ where: { listingStatus: "PENDING_REVIEW" } }),
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.business.count({ where: { listingStatus: "PUBLISHED" } }),
    prisma.business.findMany({
      where: { listingStatus: "PENDING_REVIEW" },
      include: { category: true, location: true, owner: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.verificationRequest.findMany({
      where: { status: "PENDING" },
      include: {
        business: {
          include: {
            category: true,
            location: true
          }
        },
        submitter: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.review.findMany({
      where: { status: "PENDING" },
      include: {
        business: true,
        user: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        business: true,
        review: true,
        reporter: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.business.findMany({
      where: { listingStatus: "PUBLISHED" },
      include: {
        category: true,
        location: true,
        plan: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { endsAt: "desc" }
        },
        featuredPlacements: {
          where: {
            status: "ACTIVE",
            endsAt: { gte: now }
          }
        }
      },
      orderBy: [
        { featuredPlacements: { _count: "desc" } },
        { createdAt: "desc" }
      ],
      take: 12
    }),
    prisma.user.findMany({
      where: userWhere,
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.business.findMany({
      where: businessWhere,
      include: {
        category: true,
        location: true,
        owner: true
      },
      orderBy: { updatedAt: "desc" },
      take: 12
    }),
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.contactLead.findMany({
      include: {
        business: {
          include: {
            owner: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.contactLead.count({ where: { status: "NEW" } }),
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        plan: { annualPrice: { gt: 0 } },
        endsAt: {
          gt: now,
          lte: renewalWindowEndsAt
        }
      }
    }),
    prisma.subscription.count({
      where: {
        status: { in: ["ACTIVE", "EXPIRED"] },
        plan: { annualPrice: { gt: 0 } },
        endsAt: { lte: now }
      }
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        plan: { annualPrice: { gt: 0 } },
        endsAt: {
          gt: now,
          lte: renewalWindowEndsAt
        }
      },
      include: {
        plan: true,
        business: {
          include: {
            owner: true
          }
        }
      },
      orderBy: { endsAt: "asc" },
      take: 8
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "EXPIRED"] },
        plan: { annualPrice: { gt: 0 } },
        endsAt: { lte: now }
      },
      include: {
        plan: true,
        business: {
          include: {
            owner: true
          }
        }
      },
      orderBy: { endsAt: "desc" },
      take: 8
    })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Admin</p>
      <h1 className="text-5xl font-black tracking-normal">Tradia control center</h1>
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {[
          [String(pendingListings), "Pending listings"],
          [String(verificationRequests), "Verification requests"],
          [String(reports), "Open reports"],
          [String(publishedListings), "Published listings"],
          [String(newLeads), "New enquiries"],
          [String(expiringSubscriptionCount), "Renewals due"],
          [String(expiredSubscriptionCount), "Expired plans"]
        ].map(([value, label]) => (
          <article key={label} className="rounded-tradia border border-slate-200 bg-white p-5">
            <strong className="block text-3xl font-black text-ink">{value}</strong>
            <span className="text-sm text-slate-600">{label}</span>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-tradia border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black">Renewals due soon</h2>
            <p className="mt-1 text-sm text-slate-600">Paid subscriptions ending in the next 30 days.</p>
          </div>
          <div className="divide-y divide-slate-200">
            {expiringSubscriptions.length ? expiringSubscriptions.map((subscription) => (
              <article key={subscription.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{subscription.business.name}</h3>
                  <p className="text-sm text-slate-600">
                    {subscription.plan.name} ends {subscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Owner: {subscription.business.owner?.name ?? "Unassigned"}{subscription.business.owner?.email ? ` - ${subscription.business.owner.email}` : ""}
                  </p>
                </div>
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/businesses/${subscription.businessId}`}>
                  Open
                </a>
              </article>
            )) : (
              <p className="p-5 text-sm text-slate-600">No paid subscriptions are due within 30 days.</p>
            )}
          </div>
        </div>

        <div className="rounded-tradia border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black">Expired paid plans</h2>
            <p className="mt-1 text-sm text-slate-600">These businesses now receive Free-level benefits until they renew.</p>
          </div>
          <div className="divide-y divide-slate-200">
            {expiredSubscriptions.length ? expiredSubscriptions.map((subscription) => (
              <article key={subscription.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{subscription.business.name}</h3>
                  <p className="text-sm text-slate-600">
                    {subscription.plan.name} expired {subscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Owner: {subscription.business.owner?.name ?? "Unassigned"}{subscription.business.owner?.email ? ` - ${subscription.business.owner.email}` : ""}
                  </p>
                </div>
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/businesses/${subscription.businessId}`}>
                  Open
                </a>
              </article>
            )) : (
              <p className="p-5 text-sm text-slate-600">No paid subscriptions have expired.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Lead management</h2>
          <p className="mt-1 text-sm text-slate-600">Monitor business enquiries and flag spam or closed opportunities.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {recentLeads.length ? recentLeads.map((lead) => (
            <article key={lead.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-black">{lead.name} - {lead.business.name}</h3>
                <p className="text-sm text-slate-600">{lead.email ?? lead.phone ?? "No contact"} - {lead.message}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Owner: {lead.business.owner?.name ?? "Unassigned"} - Status: {lead.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["CONTACTED", "CLOSED", "SPAM"].map((status) => (
                  <form key={status} action={updateAdminLeadStatusAction}>
                    <AdminActionTokenInput token={adminActionToken} />
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value={status} />
                    <button className="rounded-tradia bg-slate-100 px-3 py-2 text-sm font-bold text-ink" disabled={lead.status === status}>
                      {status.toLowerCase()}
                    </button>
                  </form>
                ))}
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No enquiries have been submitted yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Recent admin activity</h2>
          <p className="mt-1 text-sm text-slate-600">Track moderation, verification, user, and listing changes.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {recentAuditLogs.length ? recentAuditLogs.map((log) => (
            <article key={log.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-black">{formatAuditAction(log.action)}</h3>
                <p className="text-sm text-slate-600">
                  {log.entityType} - {log.actor?.name ?? "System"}
                </p>
              </div>
              <time className="text-sm font-bold text-slate-500" dateTime={log.createdAt.toISOString()}>
                {log.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No admin activity has been recorded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-tradia border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black">User management</h2>
            <p className="mt-1 text-sm text-slate-600">Edit roles, account status, and contact details.</p>
            <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" action="/admin">
              <input
                className="rounded-tradia border border-slate-200 px-4 py-3 text-sm"
                name="userSearch"
                defaultValue={params.userSearch ?? ""}
                placeholder="Search name, email, or phone"
              />
              <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white">Search</button>
            </form>
          </div>
          <div className="divide-y divide-slate-200">
            {recentUsers.map((managedUser) => (
              <article key={managedUser.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{managedUser.name}</h3>
                  <p className="text-sm text-slate-600">{managedUser.email} - {managedUser.role.replace("_", " ")} - {managedUser.status}</p>
                </div>
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/users/${managedUser.id}`}>
                  Edit
                </a>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-tradia border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black">Business management</h2>
            <p className="mt-1 text-sm text-slate-600">Manually update listings, status, owner, category, and location.</p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" action="/admin">
              <input
                className="rounded-tradia border border-slate-200 px-4 py-3 text-sm sm:col-span-2"
                name="businessSearch"
                defaultValue={params.businessSearch ?? ""}
                placeholder="Search business, owner, or address"
              />
              <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="listingStatus" defaultValue={params.listingStatus ?? ""}>
                <option value="">All listing statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="PUBLISHED">Published</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="verificationStatus" defaultValue={params.verificationStatus ?? ""}>
                <option value="">All verification statuses</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white sm:col-span-2">Apply Filters</button>
            </form>
          </div>
          <div className="divide-y divide-slate-200">
            {recentBusinesses.map((managedBusiness) => (
              <article key={managedBusiness.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{managedBusiness.name}</h3>
                  <p className="text-sm text-slate-600">
                    {managedBusiness.category.name} in {managedBusiness.location.name} - {managedBusiness.listingStatus.replace("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500">Owner: {managedBusiness.owner?.name ?? "Unassigned"}</p>
                </div>
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/businesses/${managedBusiness.id}`}>
                  Edit
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Pending business approvals</h2>
          <p className="mt-1 text-sm text-slate-600">Approve legitimate listings so they appear publicly.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {pendingBusinesses.length ? pendingBusinesses.map((business) => (
            <article key={business.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-lg font-black">{business.name}</h3>
                <p className="text-sm text-slate-600">
                  {business.category.name} in {business.location.name} - submitted by {business.owner?.name ?? "Unknown"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{business.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approveBusinessAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Approve</button>
                </form>
                <form action={rejectBusinessAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <button className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">Reject</button>
                </form>
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No pending business listings right now.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Featured listing controls</h2>
          <p className="mt-1 text-sm text-slate-600">Boost selected businesses on the homepage and directory during launch campaigns.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {publishedBusinesses.map((business) => {
            const isFeatured = business.featuredPlacements.length > 0;
            const benefits = getBusinessPlanState(business).benefits;

            return (
              <article key={business.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h3 className="text-lg font-black">{business.name}</h3>
                  <p className="text-sm text-slate-600">
                    {business.category.name} in {business.location.name} - {business.plan?.name ?? "Free"}
                    {isFeatured ? " - Featured" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={featureBusinessAction}>
                    <AdminActionTokenInput token={adminActionToken} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" disabled={isFeatured || !benefits.canBeFeatured}>
                      {benefits.canBeFeatured ? "Feature" : "Needs Gold"}
                    </button>
                  </form>
                  <form action={unfeatureBusinessAction}>
                    <AdminActionTokenInput token={adminActionToken} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <button className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" disabled={!isFeatured}>
                      Remove
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Pending verification requests</h2>
          <p className="mt-1 text-sm text-slate-600">Review uploaded proof documents before granting verified status.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {pendingVerificationRequests.length ? pendingVerificationRequests.map((request) => (
            <article key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-lg font-black">{request.business.name}</h3>
                <p className="text-sm text-slate-600">
                  {request.business.category.name} in {request.business.location.name} - submitted by {request.submitter.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {request.documentType}{request.notes ? ` - ${request.notes}` : ""}
                </p>
                <a className="mt-2 inline-flex text-sm font-bold text-forest" href={request.documentUrl} target="_blank">
                  View uploaded document
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approveVerificationAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Verify</button>
                </form>
                <form action={rejectVerificationAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">Reject</button>
                </form>
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No pending verification requests right now.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Pending review moderation</h2>
          <p className="mt-1 text-sm text-slate-600">Publish legitimate reviews or reject low-quality and abusive content.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {pendingReviews.length ? pendingReviews.map((review) => (
            <article key={review.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-lg font-black">{review.title ?? "Customer review"} - {review.rating}/5</h3>
                <p className="text-sm text-slate-600">{review.business.name} - submitted by {review.user.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{review.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={publishReviewAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Publish</button>
                </form>
                <form action={rejectReviewAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">Reject</button>
                </form>
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No pending reviews right now.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Open reports</h2>
          <p className="mt-1 text-sm text-slate-600">Handle listing and review reports from users.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {openReports.length ? openReports.map((report) => (
            <article key={report.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-lg font-black">{report.type}</h3>
                <p className="text-sm text-slate-600">
                  Reporter: {report.reporter.name}
                  {report.business ? ` - Business: ${report.business.name}` : ""}
                  {report.review ? ` - Review: ${report.review.rating}/5` : ""}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{report.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.reviewId ? (
                  <form action={removeReviewAction}>
                    <AdminActionTokenInput token={adminActionToken} />
                    <input type="hidden" name="reviewId" value={report.reviewId} />
                    <button className="rounded-tradia bg-ember px-4 py-2 text-sm font-bold text-white">Remove Review</button>
                  </form>
                ) : null}
                <form action={resolveReportAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Resolve</button>
                </form>
                <form action={dismissReportAction}>
                  <AdminActionTokenInput token={adminActionToken} />
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">Dismiss</button>
                </form>
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No open reports right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminActionTokenInput({ token }: { token: string }) {
  return <input type="hidden" name="adminActionToken" value={token} />;
}

function isListingStatus(value?: string): value is "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" {
  return Boolean(value && ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"].includes(value));
}

function isVerificationStatus(value?: string): value is "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" {
  return Boolean(value && ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(value));
}

function formatAuditAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
