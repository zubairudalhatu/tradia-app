import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdsenseSlot } from "@/components/adsense-slot";
import { BusinessCard } from "@/components/business-card";
import { countPublishedBusinesses, listPublishedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";

type BusinessesPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    verified?: string;
    open?: string;
    page?: string;
  }>;
};

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Browse Nigerian Businesses | Verified Business Directory",
  description: "Search Tradia's Nigeria business directory by name, category, service, location, and verification status. Find trusted local businesses and SME listings.",
  alternates: {
    canonical: "/businesses"
  },
  keywords: [
    "find businesses in Nigeria",
    "verified businesses in Nigeria",
    "local business directory Nigeria",
    "online business listing Nigeria",
    "trusted businesses in Nigeria",
    "business directory in Nigeria"
  ],
  openGraph: {
    title: "Browse Nigerian Businesses on Tradia",
    description: "Find verified businesses, local services, reviews, and contact details across Nigeria.",
    url: "/businesses",
    type: "website"
  }
};

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageSize = 12;
  const filters = {
    q: params.q,
    category: params.category,
    location: params.location,
    verified: params.verified === "1",
    open: params.open === "1",
    limit: pageSize,
    page: currentPage,
    rotate: !params.q && currentPage === 1
  };
  const [businesses, totalBusinesses, popularCategories, locationGroups] = hasDatabaseUrl()
    ? await Promise.all([
        listPublishedBusinesses(filters),
        countPublishedBusinesses(filters),
        listActiveCategories(),
        listActiveStateAreaGroups()
      ])
    : [
        [] as Awaited<ReturnType<typeof listPublishedBusinesses>>,
        0,
        [] as Awaited<ReturnType<typeof listActiveCategories>>,
        [] as Awaited<ReturnType<typeof listActiveStateAreaGroups>>
      ];
  const totalPages = Math.max(Math.ceil(totalBusinesses / pageSize), 1);
  const safePage = Math.min(currentPage, totalPages);
  const showingStart = totalBusinesses ? (safePage - 1) * pageSize + 1 : 0;
  const showingEnd = totalBusinesses ? Math.min(showingStart + businesses.length - 1, totalBusinesses) : 0;
  const activeFilterCount = [
    params.q,
    params.category,
    params.location,
    params.verified === "1" ? "verified" : "",
    params.open === "1" ? "open" : ""
  ].filter(Boolean).length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-extrabold uppercase text-ember">Directory</p>
          <h1 className="text-5xl font-black tracking-normal">Browse Nigerian businesses</h1>
          <p className="mt-4 text-lg text-slate-600">
            Search Nigeria business listings by name, category, service, location, opening status, and verification.
          </p>
        </div>
        <div className="rounded-tradia border border-slate-200 bg-white p-4 shadow-sm">
          <strong className="block text-3xl font-black text-ink">{totalBusinesses.toLocaleString("en-NG")}</strong>
          <span className="text-sm font-bold text-slate-500">matching business{totalBusinesses === 1 ? "" : "es"}</span>
        </div>
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
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" name="open" value="1" defaultChecked={params.open === "1"} />
              Open now
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

        <section className="min-w-0">
          <AdsenseSlot
            slot={process.env.NEXT_PUBLIC_ADSENSE_DIRECTORY_SLOT}
            className="mb-4"
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-tradia border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-600">
              {totalBusinesses
                ? `Showing ${showingStart.toLocaleString("en-NG")}-${showingEnd.toLocaleString("en-NG")} of ${totalBusinesses.toLocaleString("en-NG")}`
                : "No businesses match this search"}
            </p>
            {activeFilterCount ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-forest">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">All listings</span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {businesses.length ? businesses.map((business) => (
              <BusinessCard key={business.slug} business={business} />
            )) : (
              <div className="rounded-tradia border border-slate-200 bg-white p-5 md:col-span-2">
                <h2 className="text-xl font-black">No businesses found</h2>
                <p className="mt-2 text-sm text-slate-600">Try a different search term, category, area, or remove one filter.</p>
                <Link href="/businesses/new" className="mt-4 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                  Add a business in this area
                </Link>
              </div>
            )}
          </div>
          {totalPages > 1 ? (
            <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-tradia border border-slate-200 bg-white p-4" aria-label="Pagination">
              <PaginationLink
                disabled={safePage <= 1}
                href={buildBusinessesHref(params, safePage - 1)}
              >
                Previous
              </PaginationLink>
              <span className="text-sm font-bold text-slate-600">
                Page {safePage.toLocaleString("en-NG")} of {totalPages.toLocaleString("en-NG")}
              </span>
              <PaginationLink
                disabled={safePage >= totalPages}
                href={buildBusinessesHref(params, safePage + 1)}
              >
                Next
              </PaginationLink>
            </nav>
          ) : null}
          <div className="mt-6 rounded-tradia border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Need more visibility?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add your business to Tradia to appear in category and location searches, collect reviews, request verification, and receive customer enquiries.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/businesses/new" className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">List your business</Link>
              <Link href="/pricing" className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">Compare plans</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function buildBusinessesHref(params: Awaited<BusinessesPageProps["searchParams"]>, page: number) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.location) query.set("location", params.location);
  if (params.verified === "1") query.set("verified", "1");
  if (params.open === "1") query.set("open", "1");
  if (page > 1) query.set("page", String(page));

  const suffix = query.toString();
  return suffix ? `/businesses?${suffix}` : "/businesses";
}

function PaginationLink({
  disabled,
  href,
  children
}: {
  disabled: boolean;
  href: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
      {children}
    </Link>
  );
}
