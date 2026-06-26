import { AnalyticsLink } from "@/components/analytics-events";

type BusinessCardProps = {
  business: {
    slug: string;
    name: string;
    description: string;
    averageRating: unknown;
    reviewCount?: number;
    verificationStatus: string;
    category: { name: string };
    location: { name: string };
    logoUrl?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    website?: string | null;
    plan?: { canBeFeatured: boolean } | null;
    featuredPlacements?: unknown[];
  };
};

export function BusinessCard({ business }: BusinessCardProps) {
  const isFeatured = Boolean(business.featuredPlacements?.length || business.plan?.canBeFeatured);
  const isVerified = business.verificationStatus === "VERIFIED";
  const rating = Number(business.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const contactCount = [business.phone, business.whatsapp, business.email, business.website].filter(Boolean).length;

  return (
    <AnalyticsLink
      href={`/businesses/${business.slug}`}
      eventName="open_full_profile"
      eventProperties={{
        surface: "business_card",
        businessSlug: business.slug,
        category: business.category.name,
        location: business.location.name,
        verified: isVerified
      }}
      className="group min-w-0 rounded-tradia border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-forest hover:shadow-md sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-tradia border border-slate-200 bg-white object-contain p-1"
            />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-tradia bg-emerald-50 text-lg font-black text-forest">
              {business.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
          <h2 className="break-words text-lg font-black sm:text-xl">{business.name}</h2>
          <p className="text-sm text-slate-600">{business.category.name} in {business.location.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isFeatured ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-ember">Featured</span>
          ) : null}
          {isVerified ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-forest">Verified</span>
          ) : null}
        </div>
      </div>
      <p className="line-clamp-3 break-words text-sm leading-6 text-slate-600">{business.description}</p>
      <div className="mt-4 grid gap-2 rounded-tradia bg-slate-50 p-3 text-xs font-bold text-slate-600 min-[390px]:grid-cols-3">
        <span className="min-w-0">
          <strong className="block text-sm text-ink">{hasRating ? rating.toFixed(1) : "New"}</strong>
          {business.reviewCount ? `${business.reviewCount} review${business.reviewCount === 1 ? "" : "s"}` : "No reviews yet"}
        </span>
        <span className="min-w-0">
          <strong className="block text-sm text-ink">{contactCount || "Limited"}</strong>
          Contact channel{contactCount === 1 ? "" : "s"}
        </span>
        <span className="min-w-0">
          <strong className="block text-sm text-ink">{isVerified ? "Trusted" : "Listed"}</strong>
          Tradia status
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <div className="flex flex-wrap gap-2">
        <span>{business.location.name}</span>
          <span>{isVerified ? "Verified" : "Pending verification"}</span>
        </div>
        <span className="text-forest transition group-hover:translate-x-1">View profile</span>
      </div>
    </AnalyticsLink>
  );
}
