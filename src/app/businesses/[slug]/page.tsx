import type { Metadata } from "next";
import type { Location } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdsenseSlot } from "@/components/adsense-slot";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
import { BusinessGrowthTools } from "@/components/business-growth-tools";
import { BusinessOwnerMediaPanel } from "@/components/business-owner-media-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { getBusinessProfileCompleteness } from "@/lib/profile-completeness";
import { getBusinessBySlug } from "@/lib/queries/businesses";
import {
  deleteProfileMediaAction,
  reportBusinessAction,
  reportReviewAction,
  submitBusinessLeadAction,
  submitReviewAction,
  updateProfileCoverCropAction,
  uploadProfileMediaAction
} from "./actions";

export const dynamic = "force-dynamic";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string; report?: string; enquiry?: string; media?: string; claim?: string }>;
};

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) return {};

  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com").replace(/\/$/, "");
  const profileUrl = `${baseUrl}/businesses/${business.slug}`;
  const stateName = getStateName(business.location);
  const areaName = getAreaName(business.location);
  const title = `${business.name} - ${business.category.name} in ${areaName}, ${stateName} | Tradia`;
  const description = buildMetaDescription(
    business.name,
    business.category.name,
    areaName,
    stateName,
    business.description,
    business.verificationStatus === "VERIFIED"
  );
  const images = [
    business.coverUrl,
    business.logoUrl,
    ...business.media.filter((item) => isImageMedia(item.type)).map((item) => item.url)
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    alternates: {
      canonical: profileUrl
    },
    keywords: [
      business.name,
      business.category.name,
      areaName,
      stateName,
      `${business.category.name} in ${stateName}`,
      `${business.category.name} in ${areaName}`,
      "Nigerian business directory",
      "Tradia"
    ],
    openGraph: {
      title,
      description,
      url: profileUrl,
      siteName: "Tradia",
      locale: "en_NG",
      images: images.length ? images.slice(0, 4) : undefined,
      type: "website"
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.length ? images.slice(0, 1) : undefined
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
  const ownerUploadAction = uploadProfileMediaAction.bind(null, business.id, business.slug);
  const ownerCoverCropAction = updateProfileCoverCropAction.bind(null, business.id, business.slug);
  const ownerDeleteMediaAction = deleteProfileMediaAction.bind(null, business.id, business.slug);
  const completeness = getBusinessProfileCompleteness(business);
  const planState = getBusinessPlanState(business);
  const benefits = planState.benefits;
  const imageMedia = business.media.filter((item) => isImageMedia(item.type));
  const gallery = imageMedia.filter((item) => item.type !== "LOGO");
  const documentMedia = business.media.filter((item) => !isImageMedia(item.type));
  const primaryMedia = gallery[0] ?? imageMedia[0];
  const supportingMedia = gallery.filter((item) => item.id !== primaryMedia?.id).slice(0, 4);
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com").replace(/\/$/, "");
  const isVerified = business.verificationStatus === "VERIFIED";
  const hasDirectContact = Boolean(business.phone || business.whatsapp || business.email || business.website);
  const contactMethods = [
    business.phone ? "Phone" : null,
    business.whatsapp ? "WhatsApp" : null,
    business.email ? "Email" : null,
    business.website ? "Website" : null
  ].filter(Boolean);
  const activePlanName = benefits.name;
  const stateName = getStateName(business.location);
  const areaName = getAreaName(business.location);
  const profileUrl = `${baseUrl}/businesses/${business.slug}`;
  const reviewUrl = `${profileUrl}#reviews`;
  const shareText = `View ${business.name} on Tradia`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${profileUrl}`)}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address}, ${areaName}, ${stateName}, Nigeria`)}`;
  const isOwner = user?.id === business.ownerId;
  const canEditBusiness = user?.id === business.ownerId || Boolean(user && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role));
  const editBusinessHref = user?.id === business.ownerId
    ? `/dashboard/businesses/${business.id}/edit`
    : `/admin/businesses/${business.id}`;
  const lastUpdated = business.updatedAt.toLocaleDateString("en-NG", { dateStyle: "medium" });
  const listedSince = business.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" });
  const verifiedSince = business.verificationGrantedAt?.toLocaleDateString("en-NG", { dateStyle: "medium" });
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
    "@id": `${profileUrl}#business`,
    name: business.name,
    description: business.description,
    url: profileUrl,
    image: [
      business.coverUrl,
      business.logoUrl,
      ...imageMedia.map((item) => item.url)
    ].filter(Boolean),
    logo: business.logoUrl || undefined,
    telephone: business.phone || business.whatsapp || undefined,
    email: business.email || undefined,
    category: business.category.name,
    priceRange: activePlanName,
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${areaName}, ${stateName}, Nigeria`
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: areaName,
      addressRegion: stateName,
      addressCountry: "NG"
    },
    openingHoursSpecification: business.hours.some((hour) => !hour.isClosed && hour.opensAt && hour.closesAt)
      ? business.hours.filter((hour) => !hour.isClosed && hour.opensAt && hour.closesAt).map((hour) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayName(hour.dayOfWeek),
        opens: hour.opensAt,
        closes: hour.closesAt
      }))
      : undefined,
    aggregateRating: business.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(business.averageRating).toFixed(1),
          reviewCount: business.reviewCount
        }
      : undefined
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      {query.media ? (
        <p className={`mt-5 rounded-tradia border p-4 text-sm font-bold ${
          ["uploaded", "crop-saved", "deleted"].includes(query.media)
            ? "border-emerald-200 bg-emerald-50 text-forest"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {mediaMessage(query.media)}
        </p>
      ) : null}
      {query.claim ? (
        <p className={`mt-5 rounded-tradia border p-4 text-sm font-bold ${
          ["submitted", "already-pending"].includes(query.claim)
            ? "border-emerald-200 bg-emerald-50 text-forest"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {claimMessage(query.claim)}
        </p>
      ) : null}
      <section className="overflow-hidden rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          {business.coverUrl ? (
            <img
              className="h-80 w-full bg-slate-100 object-cover sm:h-72 md:h-64"
              src={business.coverUrl}
              alt={`${business.name} cover image`}
              style={{ objectPosition: `${business.coverCropX}% ${business.coverCropY}%` }}
            />
          ) : (
            <div className="h-80 bg-gradient-to-br from-forest to-ink sm:h-72 md:h-64" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          {isOwner ? (
            <BusinessOwnerMediaPanel
              businessName={business.name}
              logoUrl={business.logoUrl}
              coverUrl={business.coverUrl}
              coverCropX={business.coverCropX}
              coverCropY={business.coverCropY}
              media={business.media.map((item) => ({
                id: item.id,
                type: item.type,
                url: item.url
              }))}
              uploadAction={ownerUploadAction}
              cropAction={ownerCoverCropAction}
              deleteAction={ownerDeleteMediaAction}
            />
          ) : null}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5 sm:gap-4">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              {business.logoUrl ? (
                <img className="h-16 w-16 shrink-0 rounded-tradia border-4 border-white bg-white object-contain p-1 shadow-lg sm:h-24 sm:w-24 sm:p-2" src={business.logoUrl} alt={`${business.name} logo`} />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-tradia border-4 border-white bg-white text-2xl font-black text-forest shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                  {business.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="mb-1 text-xs font-black text-white/80 sm:mb-2 sm:text-sm">{business.category.name} in {areaName}, {stateName}</p>
                <h1 className="max-w-3xl break-words text-xl font-black leading-tight tracking-normal text-white sm:text-4xl md:text-5xl">{business.name}</h1>
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
        {isOwner ? (
          <BusinessGrowthTools
            businessName={business.name}
            profileUrl={profileUrl}
            reviewUrl={reviewUrl}
            isVerified={isVerified}
          />
        ) : null}
        <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <TrustMetric label="Rating" value={`${Number(business.averageRating).toFixed(1)} / 5`} />
              <TrustMetric label="Plan" value={activePlanName} />
              <TrustMetric label="Profile" value={`${completeness.percentage}%`} />
              <TrustMetric label="Contact" value={hasDirectContact ? "Available" : "Limited"} />
            </div>
            <p className="text-lg leading-8 text-slate-600">{business.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {business.phone ? (
                <ContactAction
                  href={`/businesses/${business.slug}/contact?type=phone`}
                  label="Call business"
                  value={business.phone}
                  tone="primary"
                />
              ) : null}
              {business.whatsapp || business.phone ? (
                <ContactAction
                  href={`/businesses/${business.slug}/contact?type=whatsapp`}
                  label="WhatsApp"
                  value={business.whatsapp ?? business.phone ?? ""}
                  tone="accent"
                />
              ) : null}
              {business.email ? (
                <ContactAction
                  href={`/businesses/${business.slug}/contact?type=email`}
                  label="Email"
                  value={business.email}
                />
              ) : null}
              {business.website ? (
                <ContactAction
                  href={`/businesses/${business.slug}/contact?type=website`}
                  label="Website"
                  value={displayWebsite(business.website)}
                />
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <a href={whatsappShareUrl} target="_blank" rel="noreferrer" className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink transition hover:bg-slate-200">
                Share on WhatsApp
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noreferrer" className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink transition hover:bg-slate-200">
                Share on X
              </a>
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink transition hover:bg-slate-200">
                Open Map
              </a>
              {!isOwner ? (
                <a href={`/claims/new?businessId=${business.id}`} className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink transition hover:bg-slate-200">
                  Claim Business
                </a>
              ) : null}
              {canEditBusiness ? (
                <Link href={editBusinessHref} className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white transition hover:bg-forest/90">
                  Edit Business
                </Link>
              ) : null}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <InfoCard label="Category" value={business.category.name} href={`/businesses?category=${business.category.slug}`} />
              <InfoCard label="State" value={stateName} href={`/businesses?location=${business.location.slug}`} />
              <InfoCard label="Area" value={areaName} href={`/businesses?location=${business.location.slug}`} />
              <InfoCard label="Address" value={business.address} />
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
            <dl className="grid gap-1 text-sm">
              <DetailRow label="Category" value={business.category.name} />
              <DetailRow label="State" value={stateName} />
              <DetailRow label="Area" value={areaName} />
              <DetailRow label="Address" value={business.address} />
              {business.phone ? <DetailRow label="Phone" value={business.phone} /> : null}
              {business.whatsapp ? <DetailRow label="WhatsApp" value={business.whatsapp} /> : null}
              {business.email ? <DetailRow label="Email" value={business.email} /> : null}
              {business.website ? <DetailRow label="Website" value={displayWebsite(business.website)} /> : null}
              <DetailRow label="Rating" value={Number(business.averageRating).toFixed(1)} />
              <DetailRow label="Verification" value={verificationLabel(business.verificationStatus)} />
              {verifiedSince ? <DetailRow label="Verified since" value={verifiedSince} /> : null}
              <DetailRow label="Plan level" value={activePlanName} />
              <DetailRow label="Listed since" value={listedSince} />
              <DetailRow label="Last updated" value={lastUpdated} />
            </dl>
            <div className="mt-5 rounded-tradia bg-emerald-50 p-4">
              <h3 className="font-black text-forest">Trust summary</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <span>{isVerified ? `Business documents have been reviewed by Tradia${verifiedSince ? ` since ${verifiedSince}` : ""}.` : "This business has not completed verification yet."}</span>
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
        {(primaryMedia || documentMedia.length) ? (
          <div className="border-t border-slate-200 p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Photos and documents</h2>
                <p className="mt-1 text-sm text-slate-600">Visual proof, business photos, menus, brochures, and public documents uploaded by the owner.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
                {business.media.length} upload{business.media.length === 1 ? "" : "s"}
              </span>
            </div>
            {primaryMedia ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                <a href={primaryMedia.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-tradia border border-slate-200 bg-slate-50">
                  <img className="h-80 w-full object-cover transition duration-300 group-hover:scale-105" src={cropImageUrl(primaryMedia.url, primaryMedia.type === "COVER" ? "cover" : "gallery")} alt={`${business.name} ${mediaTypeLabel(primaryMedia.type).toLowerCase()}`} />
                  <span className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink">
                    <span>{mediaTypeLabel(primaryMedia.type)}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{mediaTypeLabel(primaryMedia.type)}</span>
                  </span>
                </a>
                {supportingMedia.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {supportingMedia.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-tradia border border-slate-200 bg-slate-50">
                        <img className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" src={cropImageUrl(item.url, item.type === "COVER" ? "cover" : "gallery")} alt={`${business.name} ${mediaTypeLabel(item.type).toLowerCase()}`} />
                        <span className="block truncate px-3 py-2 text-sm font-bold text-ink">{mediaTypeLabel(item.type)}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-tradia border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                    More uploaded photos will appear here.
                  </div>
                )}
              </div>
            ) : null}
            {documentMedia.length ? (
              <div className="mt-6">
                <h3 className="text-lg font-black">Documents and resources</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {documentMedia.map((item) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-tradia border border-slate-200 bg-white p-4 transition hover:border-forest/30 hover:shadow-sm">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-500">{mediaTypeLabel(item.type)}</span>
                      <strong className="mt-3 block text-ink">{mediaTypeLabel(item.type)}</strong>
                      <span className="mt-2 block text-sm font-semibold text-forest">View file</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <AdsenseSlot
        slot={process.env.NEXT_PUBLIC_ADSENSE_BUSINESS_PROFILE_SLOT}
        className="mt-8"
      />

      <section id="reviews" className="mt-8 grid gap-8 scroll-mt-28 lg:grid-cols-[1fr_360px]">
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
            <div className="rounded-tradia bg-ink p-5 text-white">
              <p className="text-xs font-black uppercase text-emerald-200">Business enquiry</p>
              <h2 className="mt-2 text-2xl font-black">Send a message to {business.name}</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Tradia will save your enquiry and notify the business owner. Add either your email or phone so they can respond.
              </p>
            </div>
            {query.enquiry === "submitted" ? (
              <p className="mt-4 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
                Enquiry sent successfully. The business owner has been notified.
              </p>
            ) : null}
            {query.enquiry === "invalid" ? (
              <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                Please add your name, a message of at least 10 characters, and either email or phone.
              </p>
            ) : null}
            <form action={leadAction} className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-bold text-slate-600">
                Your name
                <input className="rounded-tradia border border-slate-200 px-3 py-3 text-sm" name="name" placeholder="Enter your full name" required minLength={2} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="grid gap-2 text-sm font-bold text-slate-600">
                  Email address
                  <input className="rounded-tradia border border-slate-200 px-3 py-3 text-sm" name="email" type="email" placeholder="you@example.com" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-600">
                  Phone number
                  <input className="rounded-tradia border border-slate-200 px-3 py-3 text-sm" name="phone" type="tel" placeholder="+234..." />
                </label>
              </div>
              <p className="-mt-1 text-xs font-semibold text-slate-500">Provide at least one: email or phone.</p>
              <label className="grid gap-2 text-sm font-bold text-slate-600">
                Message
                <textarea
                  className="min-h-32 rounded-tradia border border-slate-200 px-3 py-3 text-sm"
                  name="message"
                  placeholder="Tell the business what you need, preferred timing, quantity, budget, or any important details."
                  required
                  minLength={10}
                />
              </label>
              <button className="rounded-tradia bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest/90">
                Send Message
              </button>
              <div className="grid gap-2 rounded-tradia bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                <span>Stored securely in the owner dashboard</span>
                <span>Email notification sent when delivery is configured</span>
                <span>No payment is required to send an enquiry</span>
              </div>
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

function ContactAction({
  href,
  label,
  value,
  tone = "neutral"
}: {
  href: string;
  label: string;
  value: string;
  tone?: "primary" | "accent" | "neutral";
}) {
  const toneClass = tone === "primary"
    ? "bg-forest text-white hover:bg-forest/90"
    : tone === "accent"
      ? "bg-ember text-white hover:bg-ember/90"
      : "bg-slate-100 text-ink hover:bg-slate-200";

  return (
    <a href={href} className={`rounded-tradia px-4 py-3 font-bold transition ${toneClass}`}>
      <span className="block text-sm">{label}</span>
      <span className="mt-1 block truncate text-xs font-semibold opacity-80">{value}</span>
    </a>
  );
}

function InfoCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-1 block text-ink">{value}</strong>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-tradia border border-slate-200 bg-white p-4 transition hover:border-forest/30 hover:shadow-sm">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-tradia border border-slate-200 bg-white p-4">
      {content}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="break-words font-bold text-ink">{value}</dd>
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

function displayWebsite(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function isImageMedia(type: string) {
  return ["LOGO", "COVER", "GALLERY"].includes(type);
}

function mediaTypeLabel(type: string) {
  if (type === "LOGO") return "Logo";
  if (type === "COVER") return "Cover image";
  if (type === "GALLERY") return "Photo";
  if (type === "MENU") return "Menu";
  if (type === "BROCHURE") return "Brochure";
  if (type === "DOCUMENT") return "Document";
  return "File";
}

function mediaMessage(value: string) {
  if (value === "uploaded") return "Profile media uploaded successfully.";
  if (value === "crop-saved") return "Cover photo position saved.";
  if (value === "deleted") return "Uploaded media deleted.";
  if (value === "photo-limit") return "This business has reached the photo limit for its current plan.";
  if (value === "upload-too-large") return "This file is larger than the approved 5 MB upload limit. Choose a smaller file and try again.";
  if (value === "upload-storage") return "Uploads are not configured yet. Please add Cloudinary credentials in Vercel.";
  if (value === "forbidden") return "Only the business owner can update profile photos from this page.";
  if (value === "missing") return "That uploaded media item could not be found.";
  return "Please choose a valid image or file to upload.";
}

function claimMessage(value: string) {
  if (value === "submitted") return "Business claim submitted for admin review.";
  if (value === "already-pending") return "You already have a pending claim for this business.";

  return "Business claim could not be submitted. Please try again.";
}

function cropImageUrl(url: string, mode: "cover" | "gallery") {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  const transformation = mode === "cover"
    ? "c_fill,g_auto,w_1600,h_640,q_auto,f_auto"
    : "c_fill,g_auto,w_1200,h_800,q_auto,f_auto";

  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}

function getStateName(location: Location) {
  return location.type === "STATE"
    ? location.name.replace(/ Statewide$/, "")
    : location.state ?? location.name;
}

function getAreaName(location: Location) {
  return location.type === "STATE" ? "Statewide" : location.name;
}

function buildMetaDescription(
  name: string,
  category: string,
  area: string,
  state: string,
  description: string,
  isVerified: boolean
) {
  const trustPhrase = isVerified ? "Verified listing" : "Business listing";
  const summary = description.trim().replace(/\s+/g, " ");
  const text = `${trustPhrase} for ${name}, a ${category} business in ${area}, ${state}. ${summary}`;

  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}

function dayName(dayOfWeek: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek] ?? "Monday";
}
