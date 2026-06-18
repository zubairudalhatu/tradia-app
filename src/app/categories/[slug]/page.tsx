import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
import { BusinessCard } from "@/components/business-card";
import { countPublishedBusinesses, listPublishedBusinessAreas, listPublishedBusinessCategories, listPublishedBusinesses } from "@/lib/queries/businesses";
import { getActiveCategoryBySlug } from "@/lib/queries/categories";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 900;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [category, businessCount] = await Promise.all([
    getActiveCategoryBySlug(slug),
    countPublishedBusinesses({ category: slug })
  ]);

  if (!category) return {};

  return {
    title: `${category.name} Businesses in Nigeria | Tradia`,
    description: `Find verified ${category.name.toLowerCase()} businesses across Nigeria on Tradia. Browse trusted local listings, contacts, reviews, and business profiles.`,
    keywords: [
      `${category.name.toLowerCase()} businesses in Nigeria`,
      `${category.name.toLowerCase()} companies in Nigeria`,
      `verified ${category.name.toLowerCase()} businesses`,
      `find ${category.name.toLowerCase()} businesses in Nigeria`,
      "Nigeria business directory",
      "local business listings Nigeria"
    ],
    alternates: {
      canonical: `/categories/${category.slug}`
    },
    robots: businessCount ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${category.name} Businesses in Nigeria | Tradia`,
      description: `Discover trusted ${category.name.toLowerCase()} businesses across Nigeria on Tradia.`,
      url: `/categories/${category.slug}`,
      type: "website"
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, businesses, categories, areas] = await Promise.all([
    getActiveCategoryBySlug(slug),
    listPublishedBusinesses({ category: slug }),
    listPublishedBusinessCategories(),
    listPublishedBusinessAreas({ category: slug })
  ]);

  if (!category) notFound();
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com").replace(/\/$/, "");
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/businesses" },
    { label: category.name }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Category</p>
        <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">{category.name} businesses in Nigeria</h1>
        <p className="mt-4 text-lg text-slate-600">
          Discover trusted {category.name.toLowerCase()} businesses across Nigeria, with contact details, ratings, and verification signals.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Browse areas</h2>
          <div className="grid gap-2">
            {areas.length ? areas.map((area) => (
              <Link
                key={area.slug}
                href={`/locations/${area.slug}/categories/${category.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name} in {area.name}
              </Link>
            )) : (
              <p className="text-sm leading-6 text-slate-500">Area links will appear when this category has active listings.</p>
            )}
          </div>
          <h2 className="mb-4 mt-7 font-black">Other categories</h2>
          <div className="grid gap-2">
            {categories.map((item) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
          {businesses.length ? businesses.map((business) => (
            <BusinessCard key={business.slug} business={business} />
          )) : (
            <div className="rounded-tradia border border-slate-200 bg-white p-5 md:col-span-2">
              <h2 className="text-xl font-black">No listings yet</h2>
              <p className="mt-2 text-sm text-slate-600">This category page will become indexable when published listings are available.</p>
              <Link href="/businesses/new" className="mt-4 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                List your business free
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="mt-10 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Compare {category.name.toLowerCase()} businesses</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Use Tradia to find {category.name.toLowerCase()} providers with public profiles, media, contact buttons, reviews, and verification signals.
          Filter by area to discover businesses closer to your customers or community.
        </p>
      </section>
    </main>
  );
}
