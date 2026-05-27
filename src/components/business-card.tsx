import Link from "next/link";

type BusinessCardProps = {
  business: {
    slug: string;
    name: string;
    description: string;
    averageRating: unknown;
    verificationStatus: string;
    category: { name: string };
    location: { name: string };
    plan?: { canBeFeatured: boolean } | null;
    featuredPlacements?: unknown[];
  };
};

export function BusinessCard({ business }: BusinessCardProps) {
  const isFeatured = Boolean(business.featuredPlacements?.length || business.plan?.canBeFeatured);

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm transition hover:border-forest"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{business.name}</h2>
          <p className="text-sm text-slate-600">{business.category.name} in {business.location.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isFeatured ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-ember">Featured</span>
          ) : null}
          <span className="text-sm font-black text-forest">{Number(business.averageRating).toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">{business.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span>{business.location.name}</span>
        <span>{business.verificationStatus === "VERIFIED" ? "Verified" : "Pending verification"}</span>
      </div>
    </Link>
  );
}
