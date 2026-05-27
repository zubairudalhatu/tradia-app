import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveAreas } from "@/lib/queries/locations";
import { submitBusinessAction } from "./actions";

type NewBusinessPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewBusinessPage({ searchParams }: NewBusinessPageProps) {
  const [user, categories, locations, params] = await Promise.all([
    getCurrentUser(),
    listActiveCategories(),
    listActiveAreas(),
    searchParams
  ]);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Onboarding</p>
        <h1 className="text-5xl font-black tracking-normal">Sign in to add your business</h1>
        <p className="mt-4 text-lg text-slate-600">
          Business submissions are tied to owner accounts so Tradia can support approvals, edits, and verification.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-tradia bg-forest px-5 py-3 font-bold text-white" href="/login">
            Sign In
          </Link>
          <Link className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink" href="/register">
            Create Account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Onboarding</p>
      <h1 className="text-5xl font-black tracking-normal">Add your business</h1>
      {params.error ? (
        <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          Please complete the required business details.
        </p>
      ) : null}
      <form action={submitBusinessAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Business name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" placeholder="Aisha Fashion House" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Category
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Area
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="locationId" required>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Address
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="address" placeholder="Kano Municipal, Kano" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          WhatsApp
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="whatsapp" placeholder="+234..." />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" placeholder="+234..." />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="email" type="email" placeholder="business@example.com" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Website
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="website" type="url" placeholder="https://example.com" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
          Description
          <textarea
            className="min-h-32 rounded-tradia border border-slate-200 px-4 py-3"
            name="description"
            placeholder="Tell customers what you offer"
            required
          />
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">
          Submit for Approval
        </button>
      </form>
    </main>
  );
}
