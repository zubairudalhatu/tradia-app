import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
import { BusinessCard } from "@/components/business-card";
import { listPublishedBusinesses } from "@/lib/queries/businesses";
import { getActiveCategoryBySlug, listActiveCategories } from "@/lib/queries/categories";
import { listActiveAreas } from "@/lib/queries/locations";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getActiveCategoryBySlug(slug);

  if (!category) return {};

  return {
    title: `${category.name} Businesses in Nigeria | Tradia`,
    description: `Find verified ${category.name.toLowerCase()} businesses across Nigeria on Tradia. Browse trusted local listings, contacts, reviews, and business profiles.`,
    alternates: {
      canonical: `/categories/${category.slug}`
    },
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
    listActiveCategories(),
    listActiveAreas()
  ]);

  if (!category) notFound();
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/businesses" },
    { label: category.name }
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Category</p>
        <h1 className="text-5xl font-black tracking-normal">{category.name} businesses in Nigeria</h1>
        <p className="mt-4 text-lg text-slate-600">
          Discover trusted {category.name.toLowerCase()} businesses across Nigeria, with contact details, ratings, and verification signals.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Browse areas</h2>
          <div className="grid gap-2">
            {areas.map((area) => (
              <Link
                key={area.slug}
                href={`/locations/${area.slug}/categories/${category.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name} in {area.name}
              </Link>
            ))}
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
              <p className="mt-2 text-sm text-slate-600">This category page is ready for SEO as more businesses are onboarded.</p>
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
