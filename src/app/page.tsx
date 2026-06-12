import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdsenseSlot } from "@/components/adsense-slot";
import { listFeaturedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nigeria Business Directory for Verified Local Businesses",
  description: "Discover verified businesses across Nigeria on Tradia. Find local services, view reviews, explore categories, and list your business for better visibility.",
  alternates: {
    canonical: "/"
  },
  keywords: [
    "Nigeria business directory",
    "verified businesses in Nigeria",
    "find businesses in Nigeria",
    "list your business in Nigeria",
    "local business listings Nigeria",
    "trusted business directory Nigeria",
    "business discovery platform Nigeria"
  ],
  openGraph: {
    title: "Tradia | Nigeria Business Directory for Verified Local Businesses",
    description: "Discover verified businesses across Nigeria, compare reviews and contact details, and list your Nigerian business for better visibility.",
    url: "/",
    type: "website"
  }
};

export default async function HomePage() {
  const [featuredBusinesses, popularCategories, locationGroups] = hasDatabaseUrl()
    ? await Promise.all([
        listFeaturedBusinesses(6),
        listActiveCategories(),
        listActiveStateAreaGroups()
      ])
    : [
        [] as Awaited<ReturnType<typeof listFeaturedBusinesses>>,
        [] as Awaited<ReturnType<typeof listActiveCategories>>,
        [] as Awaited<ReturnType<typeof listActiveStateAreaGroups>>
      ];

  return (
    <main>
      <section className="relative min-h-[680px] overflow-hidden">
        <Image
          src="/brand/tradia-main-logo.png"
          alt=""
          width={1024}
          height={1024}
          className="absolute right-[-120px] top-20 hidden w-[620px] opacity-[0.05] lg:block"
          priority
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="mb-3 text-sm font-extrabold uppercase text-ember">Discover. Connect. Grow.</p>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-normal text-ink md:text-8xl">
              Find and grow trusted Nigerian businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Tradia is a Nigeria business directory that helps customers discover verified local
              businesses and gives SMEs a credible digital presence with reviews, claims,
              verification, and visibility plans.
            </p>
            <div className="mt-6 grid max-w-3xl gap-3 md:grid-cols-2">
              <Link href="/businesses" className="rounded-tradia border border-forest bg-forest p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="text-sm font-black uppercase text-white/70">For customers</span>
                <strong className="mt-2 block text-2xl font-black">Find a trusted business</strong>
                <span className="mt-2 block text-sm leading-6 text-white/80">
                  Search by category, location, reviews, and verification status.
                </span>
              </Link>
              <Link href="/businesses/new" className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest hover:shadow-lg">
                <span className="text-sm font-black uppercase text-ember">For business owners</span>
                <strong className="mt-2 block text-2xl font-black text-ink">List your business</strong>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Build a profile with contact buttons, reviews, media, and verification.
                </span>
              </Link>
            </div>
            <form action="/businesses" className="mt-8 grid max-w-3xl gap-3 rounded-tradia border border-slate-200 bg-white p-3 shadow-xl md:grid-cols-[1fr_180px_auto]">
              <input
                className="rounded-tradia border border-slate-200 px-4 py-3"
                name="q"
                placeholder="Hotels, schools, clinics, furniture..."
                aria-label="Search businesses"
              />
              <select className="rounded-tradia border border-slate-200 px-4 py-3" name="location" aria-label="State or area">
                <option value="">All Nigeria</option>
                {locationGroups.map((state) => (
                  <optgroup key={state.id} label={state.name}>
                    {state.children.map((area) => (
                      <option key={area.id} value={area.slug}>
                        {area.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button className="rounded-tradia bg-forest px-6 py-3 text-center font-bold text-white">
                Search
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-slate-500">
              <span className="rounded-full bg-white px-3 py-1">Verified profiles</span>
              <span className="rounded-full bg-white px-3 py-1">Direct WhatsApp contact</span>
              <span className="rounded-full bg-white px-3 py-1">Location pages</span>
              <span className="rounded-full bg-white px-3 py-1">Reviews and media</span>
            </div>
          </div>
          <div className="rounded-tradia border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-ember">Featured</p>
                <h2 className="text-2xl font-black">Businesses to explore</h2>
              </div>
              <Link href="/pricing" className="text-sm font-black text-forest">Get featured</Link>
            </div>
            <div className="grid gap-3">
              {featuredBusinesses.slice(0, 6).map((business) => (
                <Link
                  href={`/businesses/${business.slug}`}
                  key={business.slug}
                  className="rounded-tradia border border-slate-200 p-3 transition hover:border-forest"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-black">{business.name}</h2>
                      <p className="text-xs font-bold text-slate-500">
                        {business.category.name} in {business.location.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {business.featuredPlacements.length || business.plan?.canBeFeatured ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-ember">
                          Featured
                        </span>
                      ) : null}
                      {business.verificationStatus === "VERIFIED" ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-forest">
                          Verified
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{business.description}</p>
                </Link>
              ))}
            </div>
            {!featuredBusinesses.length ? (
              <div className="rounded-tradia border border-dashed border-slate-300 bg-slate-50 p-5">
                <h3 className="text-lg font-black">Featured slots are opening</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Businesses on eligible plans can appear here as Tradia grows its verified directory.
                </p>
              </div>
            ) : null}
            <Link href="/businesses" className="mt-4 inline-flex w-full justify-center rounded-tradia bg-slate-100 px-4 py-3 text-sm font-black text-ink hover:bg-emerald-50 hover:text-forest">
              Browse all businesses
            </Link>
          </div>
        </div>
      </section>

      <AdsenseSlot
        slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT}
        className="mx-auto max-w-7xl px-5 pb-10"
      />

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-5">
          {popularCategories.map((category) => (
            <Link
              href={`/businesses?category=${category.slug}`}
              key={category.slug}
              className="rounded-tradia border border-slate-200 p-4 font-bold hover:border-forest"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase text-ember">Why Tradia</p>
            <h2 className="text-4xl font-black tracking-normal text-ink">Built for Nigerian discovery and SME trust.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Customers need confidence before they call. Business owners need visibility that looks credible. Tradia brings both sides into one searchable directory.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/businesses/new" className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Add your business</Link>
              <Link href="/verification-policy" className="rounded-tradia bg-white px-5 py-3 font-bold text-ink">How verification works</Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ProofPoint
              title="Search by place"
              body="Location and category pages help customers find businesses close to them."
              href="/businesses"
              cta="Browse Businesses"
            />
            <ProofPoint
              title="Show proof"
              body="Profiles support photos, documents, reviews, opening hours, and contact details."
              href="/verification-policy"
              cta="View Verification"
            />
            <ProofPoint
              title="Grow visibility"
              body="Paid plans improve listing priority, media capacity, analytics, and featured eligibility."
              href="/pricing"
              cta="See Plans"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function ProofPoint({
  title,
  body,
  href,
  cta
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="flex min-h-56 flex-col rounded-tradia border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest hover:shadow-lg">
      <div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg font-black text-forest">
          {title.slice(0, 1)}
        </span>
        <h3 className="mt-4 text-xl font-black">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      </div>
      <Link href={href} className="mt-auto inline-flex rounded-tradia bg-slate-100 px-4 py-3 text-sm font-black text-ink hover:bg-emerald-50 hover:text-forest">
        {cta}
      </Link>
    </article>
  );
}
