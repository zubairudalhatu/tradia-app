import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessBySlug } from "@/lib/queries/businesses";
import { reportBusinessAction, reportReviewAction, submitReviewAction } from "./actions";

export const dynamic = "force-dynamic";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string; report?: string }>;
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    url: `${(process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")}/businesses/${business.slug}`,
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
      <section className="overflow-hidden rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="h-56 bg-gradient-to-br from-forest to-ink" />
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-4">
              {business.logoUrl ? (
                <img className="h-20 w-20 rounded-tradia border border-slate-200 object-cover" src={business.logoUrl} alt="" />
              ) : null}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black tracking-normal">{business.name}</h1>
                  {business.verificationStatus === "VERIFIED" ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-forest">
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold text-slate-500">{business.category.name} in {business.location.name}</p>
              </div>
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
                <dt className="text-slate-500">Rating</dt>
                <dd className="font-bold">{Number(business.averageRating).toFixed(1)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-bold">{business.listingStatus}</dd>
              </div>
            </dl>
          </aside>
        </div>
        {business.media.length ? (
          <div className="border-t border-slate-200 p-6">
            <h2 className="mb-4 text-2xl font-black">Business media</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {business.media.slice(0, 6).map((item) => (
                <a key={item.id} href={item.url} target="_blank" className="rounded-tradia border border-slate-200 p-4 text-sm">
                  <strong className="block text-ink">{item.type}</strong>
                  <span className="text-slate-600">{item.title ?? item.url}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

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
