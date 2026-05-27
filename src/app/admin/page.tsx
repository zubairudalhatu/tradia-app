import { redirect } from "next/navigation";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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
  unfeatureBusinessAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");
  const adminActionToken = createAdminActionToken(user);

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
    recentBusinesses
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
        featuredPlacements: {
          where: {
            status: "ACTIVE",
            endsAt: { gte: new Date() }
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
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.business.findMany({
      include: {
        category: true,
        location: true,
        owner: true
      },
      orderBy: { updatedAt: "desc" },
      take: 12
    })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Admin</p>
      <h1 className="text-5xl font-black tracking-normal">Tradia control center</h1>
      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        {[
          [String(pendingListings), "Pending listings"],
          [String(verificationRequests), "Verification requests"],
          [String(reports), "Open reports"],
          [String(publishedListings), "Published listings"]
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
            <h2 className="text-2xl font-black">User management</h2>
            <p className="mt-1 text-sm text-slate-600">Edit roles, account status, and contact details.</p>
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
                    <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" disabled={isFeatured}>
                      Feature
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
