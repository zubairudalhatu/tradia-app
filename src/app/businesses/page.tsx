import Link from "next/link";
import { AdsenseSlot } from "@/components/adsense-slot";
import { BusinessCard } from "@/components/business-card";
import { listPublishedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";

type BusinessesPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    verified?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    category: params.category,
    location: params.location,
    verified: params.verified === "1"
  };
  const [businesses, popularCategories, locationGroups] = await Promise.all([
    listPublishedBusinesses(filters),
    listActiveCategories(),
    listActiveStateAreaGroups()
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Directory</p>
        <h1 className="text-5xl font-black tracking-normal">Browse Nigerian businesses</h1>
        <p className="mt-4 text-lg text-slate-600">
          Search by name, category, service, location, and verification status.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 overflow-hidden rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Filters</h2>
          <form className="grid gap-4" action="/businesses">
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              Search
              <input
                className="min-w-0 rounded-tradia border border-slate-200 px-3 py-2"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Clinic, hotel, fashion..."
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              Category
              <select className="min-w-0 rounded-tradia border border-slate-200 px-3 py-2" name="category" defaultValue={params.category ?? ""}>
                <option value="">All categories</option>
                {popularCategories.map((category) => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              State / Area
              <select className="min-w-0 rounded-tradia border border-slate-200 px-3 py-2" name="location" defaultValue={params.location ?? ""}>
                <option value="">All Nigeria</option>
                {locationGroups.map((state) => (
                  <optgroup key={state.id} label={state.name}>
                    {state.children.map((area) => (
                      <option key={area.id} value={area.slug}>{area.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" name="verified" value="1" defaultChecked={params.verified === "1"} />
              Verified only
            </label>
            <button className="w-full rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Apply Filters</button>
            <Link href="/businesses" className="text-sm font-bold text-forest">Clear filters</Link>
          </form>
          <h3 className="mb-3 mt-7 font-black">Categories</h3>
          <div className="grid gap-2">
            {popularCategories.map((category) => (
              <Link
                href={`/businesses?category=${category.slug}`}
                key={category.slug}
                className="min-w-0 rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </aside>

        <section className="grid min-w-0 gap-4 md:grid-cols-2">
          <AdsenseSlot
            slot={process.env.NEXT_PUBLIC_ADSENSE_DIRECTORY_SLOT}
            className="md:col-span-2"
          />
          {businesses.length ? businesses.map((business) => (
            <BusinessCard key={business.slug} business={business} />
          )) : (
            <div className="rounded-tradia border border-slate-200 bg-white p-5 md:col-span-2">
              <h2 className="text-xl font-black">No businesses found</h2>
              <p className="mt-2 text-sm text-slate-600">Try a different search term, category, or area.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
