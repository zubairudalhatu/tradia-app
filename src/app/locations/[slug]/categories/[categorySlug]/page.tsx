import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
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
    description: `Find verified ${category.name.toLowerCase()} businesses in ${area.name}. Compare trusted local profiles, reviews, and contact details on Tradia.`,
    keywords: [
      `${category.name.toLowerCase()} in ${area.name}`,
      `${category.name.toLowerCase()} businesses in ${area.name}`,
      `verified ${category.name.toLowerCase()} businesses in ${area.name}`,
      `find ${category.name.toLowerCase()} in ${area.name}`,
      `local business listings ${area.name}`,
      "Nigeria business directory"
    ],
    alternates: {
      canonical: `/locations/${area.slug}/categories/${category.slug}`
    },
    openGraph: {
      title: `${category.name} in ${area.name} | Tradia`,
      description: `Compare trusted ${category.name.toLowerCase()} businesses in ${area.name} with reviews, verification, and contact details.`,
      url: `/locations/${area.slug}/categories/${category.slug}`,
      type: "website"
    }
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
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradia.business").replace(/\/$/, "");
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: area.name, href: `/locations/${area.slug}` },
    { label: category.name, href: `/categories/${category.slug}` },
    { label: `${category.name} in ${area.name}` }
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
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
              <Link href="/businesses/new" className="mt-4 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                Add {category.name.toLowerCase()} in {area.name}
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="mt-10 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">{category.name} businesses serving {area.name}</h2>
        <p className="mt-3 leading-7 text-slate-600">
          This page helps customers find relevant {category.name.toLowerCase()} businesses in {area.name} and helps listed businesses earn stronger discovery through
          complete profiles, contact tracking, reviews, and verification.
        </p>
      </section>
    </main>
  );
}
