import Link from "next/link";
import { BusinessCard } from "@/components/business-card";
import { listPublishedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveAreas } from "@/lib/queries/locations";

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
  const [businesses, popularCategories, areas] = await Promise.all([
    listPublishedBusinesses(filters),
    listActiveCategories(),
    listActiveAreas()
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Directory</p>
        <h1 className="text-5xl font-black tracking-normal">Browse Kano businesses</h1>
        <p className="mt-4 text-lg text-slate-600">
          Search by name, category, service, location, and verification status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Filters</h2>
          <form className="grid gap-4" action="/businesses">
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              Search
              <input
                className="rounded-tradia border border-slate-200 px-3 py-2"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Clinic, hotel, fashion..."
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              Category
              <select className="rounded-tradia border border-slate-200 px-3 py-2" name="category" defaultValue={params.category ?? ""}>
                <option value="">All categories</option>
                {popularCategories.map((category) => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              Area
              <select className="rounded-tradia border border-slate-200 px-3 py-2" name="location" defaultValue={params.location ?? ""}>
                <option value="">All areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.slug}>{area.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" name="verified" value="1" defaultChecked={params.verified === "1"} />
              Verified only
            </label>
            <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">Apply Filters</button>
            <Link href="/businesses" className="text-sm font-bold text-forest">Clear filters</Link>
          </form>
          <h3 className="mb-3 mt-7 font-black">Categories</h3>
          <div className="grid gap-2">
            {popularCategories.map((category) => (
              <Link
                href={`/businesses?category=${category.slug}`}
                key={category.slug}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
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
