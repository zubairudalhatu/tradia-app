import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdsenseSlot } from "@/components/adsense-slot";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { getBusinessProfileCompleteness } from "@/lib/profile-completeness";
import { getBusinessBySlug } from "@/lib/queries/businesses";
import { reportBusinessAction, reportReviewAction, submitBusinessLeadAction, submitReviewAction } from "./actions";

export const dynamic = "force-dynamic";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string; report?: string; enquiry?: string }>;
};

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) return {};

  return {
    title: `${business.name} | ${business.category.name} in ${business.location.name} | Tradia`,
    description: `${business.description.slice(0, 150)}${business.description.length > 150 ? "..." : ""}`,
    openGraph: {
      title: `${business.name} on Tradia`,
      description: business.description,
      url: `/businesses/${business.slug}`,
      images: business.logoUrl ? [business.logoUrl] : undefined,
      type: "website"
    }
  };
}

export default async function BusinessPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [business, user] = await Promise.all([getBusinessBySlug(slug), getCurrentUser()]);

  if (!business) notFound();

  if (user?.id !== business.ownerId) {
    await prisma.business.update({
      where: { id: business.id },
      data: { viewCount: { increment: 1 } }
    });
  }

  const reviewAction = submitReviewAction.bind(null, business.id, business.slug);
  const businessReportAction = reportBusinessAction.bind(null, business.id, business.slug);
  const leadAction = submitBusinessLeadAction.bind(null, business.id, business.slug);
  const completeness = getBusinessProfileCompleteness(business);
  const planState = getBusinessPlanState(business);
  const benefits = planState.benefits;
  const gallery = business.media.filter((item) => ["GALLERY", "COVER", "LOGO"].includes(item.type));
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const isVerified = business.verificationStatus === "VERIFIED";
  const hasDirectContact = Boolean(business.phone || business.whatsapp || business.email || business.website);
  const contactMethods = [
    business.phone ? "Phone" : null,
    business.whatsapp ? "WhatsApp" : null,
    business.email ? "Email" : null,
    business.website ? "Website" : null
  ].filter(Boolean);
  const activePlanName = benefits.name;
  const lastUpdated = business.updatedAt.toLocaleDateString("en-NG", { dateStyle: "medium" });
  const listedSince = business.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" });
  const trustSignals = [
    {
      label: "Verification",
      value: isVerified ? "Verified by Tradia" : verificationLabel(business.verificationStatus),
      strong: isVerified
    },
    {
      label: "Plan level",
      value: `${activePlanName} listing`,
      strong: activePlanName !== "Free"
    },
    {
      label: "Profile",
      value: `${completeness.percentage}% complete`,
      strong: completeness.percentage >= 70
    },
    {
      label: "Reviews",
      value: `${business.reviewCount} published`,
      strong: business.reviewCount > 0
    },
    {
      label: "Media",
      value: `${business.media.length} uploaded`,
      strong: business.media.length >= 3
    },
    {
      label: "Contact",
      value: hasDirectContact ? `${contactMethods.length} contact channel${contactMethods.length === 1 ? "" : "s"}` : "Limited contact details",
      strong: hasDirectContact
    },
    {
      label: "Recent update",
      value: `Updated ${lastUpdated}`,
      strong: daysSince(business.updatedAt) <= 90
    }
  ];
  const breadcrumbs = [
    { label: "Businesses", href: "/businesses" },
    { label: business.category.name, href: `/businesses?category=${business.category.slug}` },
    { label: business.location.name, href: `/businesses?location=${business.location.slug}` },
    { label: business.name }
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    url: `${baseUrl}/businesses/${business.slug}`,
    image: business.logoUrl || business.coverUrl || undefined,
    telephone: business.phone || business.whatsapp || undefined,
    email: business.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.location.name,
      addressRegion: business.location.state || business.location.name,
      addressCountry: "NG"
    },
    aggregateRating: business.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(business.averageRating).toFixed(1),
          reviewCount: business.reviewCount
        }
      : undefined
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="overflow-hidden rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          <div
            className="h-64 bg-gradient-to-br from-forest to-ink bg-cover bg-center"
            style={business.coverUrl ? { backgroundImage: `url(${business.coverUrl})` } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {business.logoUrl ? (
                <img className="h-24 w-24 rounded-tradia border-4 border-white bg-white object-cover shadow-lg" src={business.logoUrl} alt="" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-tradia border-4 border-white bg-white text-3xl font-black text-forest shadow-lg">
                  {business.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-black text-white/80">{business.category.name} in {business.location.name}</p>
                <h1 className="max-w-3xl text-4xl font-black tracking-normal text-white md:text-5xl">{business.name}</h1>
              </div>
            </div>
            {isVerified ? (
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-forest shadow-sm">
                Verified by Tradia
              </span>
            ) : (
              <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-black text-ink shadow-sm">
                {verificationLabel(business.verificationStatus)}
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TrustMetric label="Rating" value={`${Number(business.averageRating).toFixed(1)} / 5`} />
              <TrustMetric label="Plan" value={activePlanName} />
              <TrustMetric label="Profile" value={`${completeness.percentage}%`} />
              <TrustMetric label="Contact" value={hasDirectContact ? "Available" : "Limited"} />
            </div>
            <p className="text-lg leading-8 text-slate-600">{business.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {business.phone ? (
                <a href={`/businesses/${business.slug}/contact?type=phone`} className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">
                  Call
                </a>
              ) : null}
              {business.whatsapp || business.phone ? (
                <a
                  href={`/businesses/${business.slug}/contact?type=whatsapp`}
                  className="rounded-tradia bg-ember px-5 py-3 font-bold text-white"
                >
                  WhatsApp
                </a>
              ) : null}
              {business.email ? (
                <a href={`/businesses/${business.slug}/contact?type=email`} className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink">
                  Email
                </a>
              ) : null}
              {business.website ? (
                <a href={`/businesses/${business.slug}/contact?type=website`} className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink">
                  Website
                </a>
              ) : null}
              <a href="/claims/new" className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink">
                Claim Business
              </a>
            </div>
            <div className="mt-6 rounded-tradia border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-black">Why customers can trust this listing</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="rounded-tradia bg-white p-4">
                    <strong className={signal.strong ? "text-forest" : "text-ink"}>{signal.value}</strong>
                    <span className="mt-1 block text-xs font-bold uppercase text-slate-400">{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="rounded-tradia border border-slate-200 p-5">
            <h2 className="mb-4 font-black">Business details</h2>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-bold">{business.category.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-bold">{business.location.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Address</dt>
                <dd className="text-right font-bold">{business.address}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Rating</dt>
                <dd className="font-bold">{Number(business.averageRating).toFixed(1)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Verification</dt>
                <dd className="font-bold">{verificationLabel(business.verificationStatus)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Plan level</dt>
                <dd className="font-bold">{activePlanName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Listed since</dt>
                <dd className="text-right font-bold">{listedSince}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="text-right font-bold">{lastUpdated}</dd>
              </div>
            </dl>
            <div className="mt-5 rounded-tradia bg-emerald-50 p-4">
              <h3 className="font-black text-forest">Trust summary</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <span>{isVerified ? "Business documents have been reviewed by Tradia." : "This business has not completed verification yet."}</span>
                <span>{activePlanName} listing level{planState.activeSubscription ? ` active until ${planState.activeSubscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}` : ""}</span>
                <span>{hasDirectContact ? `Available through ${contactMethods.join(", ")}` : "Direct contact details are limited"}</span>
                <span>{completeness.percentage}% profile completeness</span>
                <span>Updated {lastUpdated}</span>
              </div>
            </div>
            {completeness.missing.length ? (
              <div className="mt-5 rounded-tradia bg-slate-50 p-4">
                <h3 className="font-black">Profile still missing</h3>
                <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                  {completeness.missing.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
        {gallery.length ? (
          <div className="border-t border-slate-200 p-6">
            <h2 className="mb-4 text-2xl font-black">Photos and media</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {gallery.slice(0, 6).map((item) => (
                <a key={item.id} href={item.url} target="_blank" className="group overflow-hidden rounded-tradia border border-slate-200 bg-slate-50">
                  <img className="h-44 w-full object-cover transition group-hover:scale-105" src={item.url} alt={item.title ?? business.name} />
                  <span className="block px-4 py-3 text-sm font-bold text-ink">{item.title ?? item.type}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <AdsenseSlot
        slot={process.env.NEXT_PUBLIC_ADSENSE_BUSINESS_PROFILE_SLOT}
        className="mt-8"
      />

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Reviews</h2>
              <p className="text-sm text-slate-600">{business.reviewCount} published reviews</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-forest">
              {Number(business.averageRating).toFixed(1)} / 5
            </span>
          </div>

          <div className="grid gap-4">
            {business.reviews.length ? business.reviews.map((review) => {
              const reportAction = reportReviewAction.bind(null, business.id, review.id, business.slug);

              return (
                <article key={review.id} className="rounded-tradia border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong>{review.title ?? "Customer review"}</strong>
                      <p className="text-sm text-slate-600">By {review.user.name}</p>
                    </div>
                    <span className="font-black text-forest">{review.rating}/5</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{review.body}</p>
                  {review.ownerResponse ? (
                    <div className="mt-3 rounded-tradia bg-slate-50 p-3 text-sm text-slate-600">
                      <strong className="text-ink">Owner response:</strong> {review.ownerResponse}
                    </div>
                  ) : null}
                  {user ? (
                    <form action={reportAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                      <input className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="message" placeholder="Report this review" />
                      <button className="rounded-tradia bg-slate-100 px-3 py-2 text-sm font-bold text-ink">Report</button>
                    </form>
                  ) : null}
                </article>
              );
            }) : (
              <p className="text-sm text-slate-600">No published reviews yet.</p>
            )}
          </div>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Send enquiry</h2>
            <p className="mt-1 text-sm text-slate-600">Send a short message to this business owner.</p>
            {query.enquiry === "submitted" ? (
              <p className="mt-3 rounded-tradia bg-emerald-50 p-3 text-sm font-bold text-forest">Enquiry sent successfully.</p>
            ) : null}
            {query.enquiry === "invalid" ? (
              <p className="mt-3 rounded-tradia bg-red-50 p-3 text-sm font-bold text-red-700">Please add your name, message, and either email or phone.</p>
            ) : null}
            <form action={leadAction} className="mt-5 grid gap-3">
              <input className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="name" placeholder="Your name" required />
              <input className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="email" type="email" placeholder="Email address" />
              <input className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="phone" placeholder="Phone number" />
              <textarea className="min-h-24 rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="message" placeholder="What do you need?" required />
              <button className="rounded-tradia bg-forest px-4 py-2 font-bold text-white">Send Enquiry</button>
            </form>
          </section>

          <section className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Leave a review</h2>
            <p className="mt-1 text-sm text-slate-600">Reviews are held for moderation before publishing.</p>
            {query.review === "submitted" ? (
              <p className="mt-3 rounded-tradia bg-emerald-50 p-3 text-sm font-bold text-forest">Review submitted for moderation.</p>
            ) : null}
            {user ? (
              <form action={reviewAction} className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-bold text-slate-600">
                  Rating
                  <select className="rounded-tradia border border-slate-200 px-3 py-2" name="rating" defaultValue="5" required>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Fair</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Bad</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-600">
                  Title
                  <input className="rounded-tradia border border-slate-200 px-3 py-2" name="title" placeholder="Short summary" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-600">
                  Review
                  <textarea className="min-h-28 rounded-tradia border border-slate-200 px-3 py-2" name="body" required />
                </label>
                <button className="rounded-tradia bg-forest px-4 py-2 font-bold text-white">Submit Review</button>
              </form>
            ) : (
              <Link className="mt-5 inline-flex rounded-tradia bg-forest px-4 py-2 font-bold text-white" href="/login">
                Sign in to review
              </Link>
            )}
          </section>

          <section className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Report listing</h2>
            {query.report === "submitted" ? (
              <p className="mt-3 rounded-tradia bg-emerald-50 p-3 text-sm font-bold text-forest">Report submitted.</p>
            ) : null}
            {user ? (
              <form action={businessReportAction} className="mt-5 grid gap-3">
                <select className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="type" defaultValue="Incorrect business details">
                  <option>Incorrect business details</option>
                  <option>Fake business</option>
                  <option>Abusive content</option>
                  <option>Other issue</option>
                </select>
                <textarea className="min-h-24 rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="message" placeholder="Tell admins what looks wrong" required />
                <button className="rounded-tradia bg-slate-100 px-4 py-2 font-bold text-ink">Submit Report</button>
              </form>
            ) : (
              <Link className="mt-5 inline-flex rounded-tradia bg-slate-100 px-4 py-2 font-bold text-ink" href="/login">
                Sign in to report
              </Link>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

function TrustMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-tradia border border-slate-200 bg-white p-4">
      <strong className="block text-2xl font-black text-ink">{value}</strong>
      <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
    </div>
  );
}

function verificationLabel(status: string) {
  if (status === "VERIFIED") return "Verified by Tradia";
  if (status === "PENDING") return "Verification pending";
  if (status === "REJECTED") return "Verification not approved";
  return "Not yet verified";
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
