import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessCard } from "@/components/business-card";
import { listPublishedBusinesses } from "@/lib/queries/businesses";
import { getActiveCategoryBySlug, listActiveCategories } from "@/lib/queries/categories";
import { getActiveAreaBySlug, listActiveAreas } from "@/lib/queries/locations";

type CategoryLocationPageProps = {
  params: Promise<{ slug: string; categorySlug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryLocationPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const [area, category] = await Promise.all([
    getActiveAreaBySlug(slug),
    getActiveCategoryBySlug(categorySlug)
  ]);

  if (!area || !category) return {};

  return {
    title: `${category.name} in ${area.name} | Tradia`,
    description: `Find verified ${category.name.toLowerCase()} businesses in ${area.name}. Compare trusted local profiles, reviews, and contact details on Tradia.`
  };
}

export default async function CategoryLocationPage({ params }: CategoryLocationPageProps) {
  const { slug, categorySlug } = await params;
  const [area, category, businesses, categories, areas] = await Promise.all([
    getActiveAreaBySlug(slug),
    getActiveCategoryBySlug(categorySlug),
    listPublishedBusinesses({ location: slug, category: categorySlug }),
    listActiveCategories(),
    listActiveAreas()
  ]);

  if (!area || !category) notFound();

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Local Search</p>
        <h1 className="text-5xl font-black tracking-normal">{category.name} in {area.name}</h1>
        <p className="mt-4 text-lg text-slate-600">
          Find trusted {category.name.toLowerCase()} businesses in {area.name}, with ratings, contact options, and verification status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Related categories</h2>
          <div className="grid gap-2">
            {categories.map((item) => (
              <Link
                key={item.slug}
                href={`/locations/${area.slug}/categories/${item.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {item.name} in {area.name}
              </Link>
            ))}
          </div>
          <h2 className="mb-4 mt-7 font-black">Other areas</h2>
          <div className="grid gap-2">
            {areas.map((item) => (
              <Link
                key={item.slug}
                href={`/locations/${item.slug}/categories/${category.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name} in {item.name}
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
              <p className="mt-2 text-sm text-slate-600">This local search page is ready for SEO as more businesses are onboarded.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
