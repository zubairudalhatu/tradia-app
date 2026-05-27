import Image from "next/image";
import Link from "next/link";
import { listFeaturedBusinesses } from "@/lib/queries/businesses";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredBusinesses, popularCategories, locationGroups] = await Promise.all([
    listFeaturedBusinesses(3),
    listActiveCategories(),
    listActiveStateAreaGroups()
  ]);

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
            <p className="mb-3 text-sm font-extrabold uppercase text-ember">Nigeria-wide business discovery</p>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-normal text-ink md:text-8xl">
              Find trusted businesses across Nigeria.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Tradia helps customers discover verified local businesses and gives SMEs a credible
              digital presence with reviews, claims, verification, and subscriptions.
            </p>
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
          </div>
          <div className="rounded-tradia border border-slate-200 bg-white p-5 shadow-xl">
            <div className="grid gap-4">
              {featuredBusinesses.slice(0, 3).map((business) => (
                <Link
                  href={`/businesses/${business.slug}`}
                  key={business.slug}
                  className="rounded-tradia border border-slate-200 p-4 transition hover:border-forest"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black">{business.name}</h2>
                      <p className="text-sm text-slate-600">
                        {business.category.name} in {business.location.name}
                      </p>
                    </div>
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
                  <p className="mt-3 text-sm leading-6 text-slate-600">{business.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

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
    </main>
  );
}
