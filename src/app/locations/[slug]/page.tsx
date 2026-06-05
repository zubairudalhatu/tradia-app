import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/breadcrumbs";
import { BusinessCard } from "@/components/business-card";
import { listPublishedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { getActiveAreaBySlug, listActiveAreas } from "@/lib/queries/locations";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = await getActiveAreaBySlug(slug);

  if (!area) return {};

  return {
    title: `Businesses in ${area.name} | Tradia`,
    description: `Find verified businesses in ${area.name} on Tradia. Browse local services, shops, schools, clinics, hotels, and more.`,
    keywords: [
      `businesses in ${area.name}`,
      `verified businesses in ${area.name}`,
      `find businesses in ${area.name}`,
      `local business listings ${area.name}`,
      `${area.name} online business directory`,
      "Nigeria business directory",
      "verified businesses in Nigeria"
    ],
    alternates: {
      canonical: `/locations/${area.slug}`
    },
    openGraph: {
      title: `Businesses in ${area.name} | Tradia`,
      description: `Browse trusted businesses in ${area.name} with reviews, contact details, and verification signals.`,
      url: `/locations/${area.slug}`,
      type: "website"
    }
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const [area, businesses, categories, areas] = await Promise.all([
    getActiveAreaBySlug(slug),
    listPublishedBusinesses({ location: slug }),
    listActiveCategories(),
    listActiveAreas()
  ]);

  if (!area) notFound();
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradia.business").replace(/\/$/, "");
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Locations", href: "/businesses" },
    { label: area.name }
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs, baseUrl)) }}
      />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Location</p>
        <h1 className="text-5xl font-black tracking-normal">Businesses in {area.name}</h1>
        <p className="mt-4 text-lg text-slate-600">
          Browse trusted local businesses in {area.name}, including verified profiles, reviews, and contact options.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black">Popular searches</h2>
          <div className="grid gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/locations/${area.slug}/categories/${category.slug}`}
                className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-forest"
              >
                {category.name} in {area.name}
              </Link>
            ))}
          </div>
          <h2 className="mb-4 mt-7 font-black">Other areas</h2>
          <div className="grid gap-2">
            {areas.map((item) => (
              <Link
                key={item.slug}
                href={`/locations/${item.slug}`}
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
              <p className="mt-2 text-sm text-slate-600">This location page is ready for SEO as more businesses are onboarded.</p>
              <Link href="/businesses/new" className="mt-4 inline-flex rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                Add a business in {area.name}
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="mt-10 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Find businesses in {area.name}</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Tradia helps customers compare businesses in {area.name} by category, verification status, reviews, and direct contact options.
          Business owners can improve visibility by keeping profiles complete, uploading useful media, and requesting verification.
        </p>
      </section>
    </main>
  );
}
