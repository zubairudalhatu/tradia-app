import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { getBusinessProfileCompleteness } from "@/lib/profile-completeness";
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
  updateAdminLeadStatusAction,
  updateWalletFulfillmentAction
} from "./actions";

export const dynamic = "force-dynamic";

type QualityBusiness = Prisma.BusinessGetPayload<{
  include: {
    category: true;
    location: true;
    owner: true;
    plan: true;
    media: true;
    featuredPlacements: true;
  };
}>;

type QualityItem = {
  business: QualityBusiness;
  completeness: ReturnType<typeof getBusinessProfileCompleteness>;
  notes: string[];
};

type AdminPageProps = {
  searchParams: Promise<{
    userSearch?: string;
    businessSearch?: string;
    listingStatus?: string;
    verificationStatus?: string;
    paymentSearch?: string;
    paymentStatus?: string;
    walletSearch?: string;
    walletType?: string;
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
  const paymentSearch = params.paymentSearch?.trim();
  const walletSearch = params.walletSearch?.trim();
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
  const paymentWhere: Prisma.PaymentWhereInput = {
    ...(paymentSearch
      ? {
          OR: [
            { providerReference: { contains: paymentSearch, mode: "insensitive" } },
            { provider: { contains: paymentSearch, mode: "insensitive" } },
            { user: { name: { contains: paymentSearch, mode: "insensitive" } } },
            { user: { email: { contains: paymentSearch, mode: "insensitive" } } },
            { business: { name: { contains: paymentSearch, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(isPaymentStatus(params.paymentStatus) ? { status: params.paymentStatus } : {})
  };
  const walletWhere: Prisma.WalletTransactionWhereInput = {
    ...(walletSearch
      ? {
          OR: [
            { reference: { contains: walletSearch, mode: "insensitive" } },
            { description: { contains: walletSearch, mode: "insensitive" } },
            { user: { name: { contains: walletSearch, mode: "insensitive" } } },
            { user: { email: { contains: walletSearch, mode: "insensitive" } } },
            { business: { name: { contains: walletSearch, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(isWalletTransactionType(params.walletType) ? { type: params.walletType } : {})
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
    qualityBusinesses,
    expiringSubscriptionCount,
    expiredSubscriptionCount,
    expiringSubscriptions,
    expiredSubscriptions,
    recentPayments,
    recentWalletTransactions
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
    prisma.business.findMany({
      where: { listingStatus: "PUBLISHED" },
      include: {
        category: true,
        location: true,
        owner: true,
        plan: true,
        media: true,
        featuredPlacements: {
          where: {
            status: "ACTIVE",
            endsAt: { gte: now }
          }
        }
      },
      orderBy: [
        { verificationStatus: "asc" },
        { updatedAt: "desc" }
      ],
      take: 100
    }),
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
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: {
        user: true,
        business: true,
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: paymentSearch || params.paymentStatus ? 25 : 10
    }),
    prisma.walletTransaction.findMany({
      where: walletWhere,
      include: {
        user: true,
        business: true,
        payment: true
      },
      orderBy: { createdAt: "desc" },
      take: walletSearch || params.walletType ? 25 : 15
    })
  ]);
  const listingQuality = buildListingQualityDashboard(qualityBusinesses);

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

      {["ADMIN", "SUPER_ADMIN"].includes(user.role) ? (
        <section className="mt-8 grid gap-4 rounded-tradia border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase text-ember">User communications</p>
            <h2 className="mt-1 text-xl font-black">Broadcast center moved to its own workspace</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Compose and send verified email, SMS, and WhatsApp updates without adding noise to the operational overview.
            </p>
          </div>
          <a href="/admin/communications" className="rounded-tradia bg-forest px-5 py-3 text-center text-sm font-black text-white">Open Communications</a>
        </section>
      ) : null}

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm font-extrabold uppercase text-ember">SEO readiness</p>
          <h2 className="mt-1 text-2xl font-black">Listing quality dashboard</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Use this to improve the pages most likely to help Google trust and index Tradia: complete profiles, real media, verification, and strong feature candidates.
          </p>
        </div>
        <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-2 lg:grid-cols-5">
          {[
            [String(listingQuality.totalPublished), "Published profiles"],
            [`${listingQuality.strongPercent}%`, "80%+ complete"],
            [`${listingQuality.mediaReadyPercent}%`, "Media ready"],
            [`${listingQuality.verifiedPercent}%`, "Verified"],
            [String(listingQuality.indexReadyCount), "Index-ready profiles"]
          ].map(([value, label]) => (
            <article key={label} className="rounded-tradia border border-slate-200 bg-slate-50 p-4">
              <strong className="block text-2xl font-black text-ink">{value}</strong>
              <span className="text-sm font-bold text-slate-500">{label}</span>
            </article>
          ))}
        </div>
        <div className="grid gap-6 p-5 xl:grid-cols-2">
          <QualityPanel
            title="Profiles needing work"
            description="Improve these first before requesting indexing."
            empty="Published profiles are in good shape."
          >
            {listingQuality.incompleteProfiles.map((item) => (
              <QualityBusinessRow key={item.business.id} item={item} adminActionToken={adminActionToken} />
            ))}
          </QualityPanel>
          <QualityPanel
            title="Media gaps"
            description="Logo, cover, and gallery images make profiles feel real."
            empty="Every sampled profile has the expected media."
          >
            {listingQuality.mediaGaps.map((item) => (
              <QualityBusinessRow key={item.business.id} item={item} adminActionToken={adminActionToken} />
            ))}
          </QualityPanel>
          <QualityPanel
            title="Unverified published listings"
            description="Verification is one of the strongest trust signals."
            empty="Every sampled published profile is verified."
          >
            {listingQuality.unverifiedProfiles.map((item) => (
              <QualityBusinessRow key={item.business.id} item={item} adminActionToken={adminActionToken} />
            ))}
          </QualityPanel>
          <QualityPanel
            title="Feature candidates"
            description="Strong profiles that are ready for extra homepage visibility."
            empty="No unfeatured profile is ready yet."
          >
            {listingQuality.featureCandidates.map((item) => {
              const canBeFeatured = getBusinessPlanState(item.business).benefits.canBeFeatured;

              return (
                <article key={item.business.id} className="rounded-tradia border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                    <div>
                      <h3 className="font-black">{item.business.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.business.category.name} in {item.business.location.name}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {item.completeness.percentage}% complete - {Number(item.business.averageRating).toFixed(1)}/5 - {item.business.viewCount} views
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={adminBusinessHref(item.business.id, adminActionToken)}>
                        Edit
                      </a>
                      {canBeFeatured ? (
                        <form action={featureBusinessAction}>
                          <AdminActionTokenInput token={adminActionToken} />
                          <input type="hidden" name="businessId" value={item.business.id} />
                          <button className="rounded-tradia bg-forest px-3 py-2 text-xs font-black text-white">
                            Feature
                          </button>
                        </form>
                      ) : (
                        <a className="rounded-tradia bg-amber-50 px-3 py-2 text-xs font-black text-ember" href="/pricing">
                          Needs Gold
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </QualityPanel>
        </div>
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
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={adminBusinessHref(subscription.businessId, adminActionToken)}>
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
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={adminBusinessHref(subscription.businessId, adminActionToken)}>
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
          <h2 className="text-2xl font-black">Payment history</h2>
          <p className="mt-1 text-sm text-slate-600">Review recent checkout attempts, successful payments, and provider references.</p>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/admin">
            <input
              className="rounded-tradia border border-slate-200 px-4 py-3 text-sm"
              name="paymentSearch"
              defaultValue={params.paymentSearch ?? ""}
              placeholder="Search customer, business, provider, reference"
            />
            <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="paymentStatus" defaultValue={params.paymentStatus ?? ""}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white">
              Filter
            </button>
          </form>
        </div>
        <div className="divide-y divide-slate-200">
          {recentPayments.length ? recentPayments.map((payment) => (
            <article key={payment.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-black">
                  {payment.business?.name ?? "Unknown business"} - {formatAmount(payment.amount, payment.currency)}
                </h3>
                <p className="text-sm text-slate-600">
                  {payment.subscription?.plan.name ?? "Pending plan"} - {payment.provider} - {payment.status}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Customer: {payment.user.name} - {payment.user.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Reference: {payment.providerReference}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <time className="text-sm font-bold text-slate-500" dateTime={(payment.paidAt ?? payment.createdAt).toISOString()}>
                  {(payment.paidAt ?? payment.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </time>
                {payment.status === "SUCCESS" ? (
                  <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/admin/payments/${payment.id}/receipt?adminActionToken=${encodeURIComponent(adminActionToken)}`}>
                    Receipt
                  </a>
                ) : null}
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No payments have been recorded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm font-extrabold uppercase text-ember">Wallet operations</p>
          <h2 className="mt-1 text-2xl font-black">Wallet add-ons and top-ups</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track wallet funding, homepage feature purchases, and physical kit requests that need team follow-up.
          </p>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/admin">
            <input
              className="rounded-tradia border border-slate-200 px-4 py-3 text-sm"
              name="walletSearch"
              defaultValue={params.walletSearch ?? ""}
              placeholder="Search customer, business, add-on, reference"
            />
            <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="walletType" defaultValue={params.walletType ?? ""}>
              <option value="">All wallet activity</option>
              <option value="CREDIT">Top-ups</option>
              <option value="DEBIT">Add-on spends</option>
            </select>
            <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white">
              Filter
            </button>
          </form>
        </div>
        <div className="divide-y divide-slate-200">
          {recentWalletTransactions.length ? recentWalletTransactions.map((transaction) => {
            const metadata = walletMetadata(transaction.metadata);
            const isSpend = transaction.type === "DEBIT";
            const isFulfilled = walletFulfillmentStatus(transaction.metadata) === "FULFILLED";
            const productCode = metadataString(metadata, "productCode");
            const fulfillmentNote = metadataString(metadata, "fulfillmentNote");
            const paymentReference = transaction.payment?.providerReference ?? metadataString(metadata, "paymentReference");

            return (
              <article key={transaction.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{walletProductName(transaction.description, metadata)}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      transaction.type === "CREDIT" ? "bg-emerald-50 text-forest" : "bg-amber-50 text-ember"
                    }`}>
                      {transaction.type === "CREDIT" ? "Top-up" : "Spend"}
                    </span>
                    {isSpend ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        isFulfilled ? "bg-emerald-50 text-forest" : "bg-slate-100 text-slate-600"
                      }`}>
                        {isFulfilled ? "Fulfilled" : "Open"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Customer: {transaction.user.name} - {transaction.user.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Business: {transaction.business ? transaction.business.name : "Account wallet"}
                    {productCode ? ` - ${productCode.replaceAll("_", " ")}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Reference: {transaction.reference}{paymentReference ? ` - Payment: ${paymentReference}` : ""}
                  </p>
                  {fulfillmentNote ? (
                    <p className="mt-2 rounded-tradia bg-slate-50 p-3 text-sm font-bold text-slate-600">
                      Note: {fulfillmentNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <span className={`text-sm font-black ${transaction.type === "CREDIT" ? "text-forest" : "text-ember"}`}>
                    {transaction.type === "CREDIT" ? "+" : "-"}{formatAmount(transaction.amount, transaction.currency)}
                  </span>
                  <time className="text-sm font-bold text-slate-500" dateTime={transaction.createdAt.toISOString()}>
                    {transaction.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  {transaction.business ? (
                    <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={adminBusinessHref(transaction.business.id, adminActionToken)}>
                      Business
                    </a>
                  ) : null}
                  <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={adminUserHref(transaction.user.id, adminActionToken)}>
                    User
                  </a>
                  <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/admin/wallet/${transaction.id}/receipt?adminActionToken=${encodeURIComponent(adminActionToken)}`}>
                    Receipt
                  </a>
                  {isSpend ? (
                    <form action={updateWalletFulfillmentAction} className="grid gap-2 sm:min-w-56">
                      <AdminActionTokenInput token={adminActionToken} />
                      <input type="hidden" name="walletTransactionId" value={transaction.id} />
                      <input type="hidden" name="fulfillmentStatus" value={isFulfilled ? "OPEN" : "FULFILLED"} />
                      <textarea
                        className="min-h-16 rounded-tradia border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                        name="fulfillmentNote"
                        defaultValue={fulfillmentNote}
                        placeholder="Fulfillment note"
                      />
                      <button className={`rounded-tradia px-3 py-2 text-xs font-black ${
                        isFulfilled ? "bg-slate-100 text-ink" : "bg-forest text-white"
                      }`}>
                        {isFulfilled ? "Reopen" : "Mark fulfilled"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          }) : (
            <p className="p-5 text-sm text-slate-600">No wallet activity has been recorded yet.</p>
          )}
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

      <section className="hidden">
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
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={adminUserHref(managedUser.id, adminActionToken)}>
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
                <a className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={adminBusinessHref(managedBusiness.id, adminActionToken)}>
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

function QualityPanel({
  title,
  description,
  empty,
  children
}: {
  title: string;
  description: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="rounded-tradia border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-3">
        {hasChildren ? children : (
          <p className="rounded-tradia bg-emerald-50 p-4 text-sm font-bold text-forest">{empty}</p>
        )}
      </div>
    </section>
  );
}

function QualityBusinessRow({
  item,
  adminActionToken
}: {
  item: QualityItem;
  adminActionToken: string;
}) {
  return (
    <article className="rounded-tradia border border-slate-200 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h3 className="font-black">{item.business.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {item.business.category.name} in {item.business.location.name}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.completeness.percentage}% complete</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.business.media.length} media</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.business.verificationStatus}</span>
          </div>
          <ul className="mt-3 grid gap-1 text-sm text-slate-600">
            {item.notes.slice(0, 3).map((note) => (
              <li key={note}>Needs: {note}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={adminBusinessHref(item.business.id, adminActionToken)}>
            Edit
          </a>
          <a className="rounded-tradia bg-emerald-50 px-3 py-2 text-xs font-black text-forest" href={`/businesses/${item.business.slug}`} target="_blank" rel="noreferrer">
            View
          </a>
        </div>
      </div>
    </article>
  );
}

function buildListingQualityDashboard(businesses: QualityBusiness[]) {
  const items = businesses.map((business) => {
    const completeness = getBusinessProfileCompleteness(business);

    return {
      business,
      completeness,
      notes: buildQualityNotes(business, completeness.missing)
    };
  });
  const totalPublished = items.length;
  const strongProfiles = items.filter((item) => item.completeness.percentage >= 80).length;
  const mediaReady = items.filter((item) => isMediaReady(item.business)).length;
  const verifiedProfiles = items.filter((item) => item.business.verificationStatus === "VERIFIED").length;
  const indexReadyCount = items.filter((item) =>
    item.completeness.percentage >= 80 &&
    isMediaReady(item.business) &&
    item.business.verificationStatus === "VERIFIED"
  ).length;

  return {
    totalPublished,
    strongPercent: percent(strongProfiles, totalPublished),
    mediaReadyPercent: percent(mediaReady, totalPublished),
    verifiedPercent: percent(verifiedProfiles, totalPublished),
    indexReadyCount,
    incompleteProfiles: [...items]
      .filter((item) => item.completeness.percentage < 80)
      .sort((a, b) => a.completeness.percentage - b.completeness.percentage || b.business.updatedAt.getTime() - a.business.updatedAt.getTime())
      .slice(0, 6),
    mediaGaps: [...items]
      .filter((item) => !isMediaReady(item.business))
      .sort((a, b) => a.business.media.length - b.business.media.length || a.completeness.percentage - b.completeness.percentage)
      .slice(0, 6),
    unverifiedProfiles: [...items]
      .filter((item) => item.business.verificationStatus !== "VERIFIED")
      .sort((a, b) => b.completeness.percentage - a.completeness.percentage || b.business.viewCount - a.business.viewCount)
      .slice(0, 6),
    featureCandidates: [...items]
      .filter((item) =>
        item.completeness.percentage >= 80 &&
        isMediaReady(item.business) &&
        item.business.verificationStatus === "VERIFIED" &&
        item.business.featuredPlacements.length === 0
      )
      .sort((a, b) => qualityScore(b) - qualityScore(a))
      .slice(0, 6)
  };
}

function buildQualityNotes(business: QualityBusiness, missing: string[]) {
  const mediaNotes = [
    business.logoUrl ? "" : "Upload business logo",
    business.coverUrl ? "" : "Upload cover image",
    business.media.length >= 3 ? "" : "Upload at least 3 media items"
  ].filter(Boolean);
  const notes = [...new Set([...mediaNotes, ...missing])];

  return notes.length ? notes : ["Keep profile fresh with recent photos and reviews"];
}

function isMediaReady(business: QualityBusiness) {
  return Boolean(business.logoUrl && business.coverUrl && business.media.length >= 3);
}

function qualityScore(item: QualityItem) {
  return (
    item.completeness.percentage * 1000 +
    item.business.reviewCount * 30 +
    item.business.viewCount * 2 +
    Number(item.business.averageRating) * 50 +
    (item.business.plan?.listingPriority ?? 0) * 25
  );
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function adminUserHref(userId: string, token: string) {
  return `/admin/users/${userId}?adminActionToken=${encodeURIComponent(token)}`;
}

function adminBusinessHref(businessId: string, token: string) {
  return `/admin/businesses/${businessId}?adminActionToken=${encodeURIComponent(token)}`;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function walletMetadata(value: Prisma.JsonValue | null) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function walletProductName(description: string, metadata: Record<string, unknown>) {
  return metadataString(metadata, "productName") || description;
}

function walletFulfillmentStatus(value: Prisma.JsonValue | null) {
  const status = metadataString(walletMetadata(value), "fulfillmentStatus");
  return status === "FULFILLED" ? "FULFILLED" : "OPEN";
}

function isListingStatus(value?: string): value is "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" {
  return Boolean(value && ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"].includes(value));
}

function isVerificationStatus(value?: string): value is "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" {
  return Boolean(value && ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(value));
}

function isPaymentStatus(value?: string): value is "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" {
  return Boolean(value && ["PENDING", "SUCCESS", "FAILED", "REFUNDED"].includes(value));
}

function isWalletTransactionType(value?: string): value is "CREDIT" | "DEBIT" {
  return Boolean(value && ["CREDIT", "DEBIT"].includes(value));
}

function formatAuditAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
