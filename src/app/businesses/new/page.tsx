import Link from "next/link";
import { redirect } from "next/navigation";
import { isUserAccountVerified } from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateSelections } from "@/lib/queries/locations";
import { submitBusinessAction } from "./actions";
import { BusinessNameSuggestions } from "@/components/business-name-suggestions";

type NewBusinessPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewBusinessPage({ searchParams }: NewBusinessPageProps) {
  const [user, categories, stateOptions, params] = await Promise.all([
    getCurrentUser(),
    listActiveCategories(),
    listActiveStateSelections(),
    searchParams
  ]);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Onboarding</p>
        <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">Sign in to list your business free</h1>
        <p className="mt-4 text-lg text-slate-600">
          Business submissions are tied to owner accounts so Tradia can support approvals, edits, and verification.
        </p>
        <div className="mt-6 grid gap-3 rounded-tradia border border-slate-200 bg-white p-5">
          <OnboardingBenefit title="Own your public profile" body="Keep your contact details, description, photos, and service information in one trusted place." />
          <OnboardingBenefit title="Build customer confidence" body="Collect reviews, request verification, and show proof that your business is active." />
          <OnboardingBenefit title="Appear in local discovery" body="Get listed on category and location pages where customers are already searching." />
        </div>
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

  if (!isUserAccountVerified(user)) {
    redirect("/verify-account");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Onboarding</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">List your business free</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        Create a profile customers can trust. Start with the required details, then add media, opening hours, verification documents, and a visibility plan from your dashboard.
      </p>
      {params.error ? (
        <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {params.error === "duplicate"
            ? "A very similar business is already listed or waiting for review in this state. Check the suggested businesses before submitting again."
            : "Please complete the required business details. Description must be at least 20 characters."}
        </p>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
      <form action={submitBusinessAction} className="grid gap-4 rounded-tradia border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2">
        <BusinessNameSuggestions />
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Category
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          State
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="locationId" required>
            {stateOptions.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Address
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="address" placeholder="Wuse 2, Abuja or Ikeja, Lagos" required />
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
            minLength={20}
            placeholder="Tell customers what you offer. Minimum 20 characters."
            required
          />
          <span className="text-xs font-semibold text-slate-500">
            Minimum 20 characters. Example: Advertising agency helping businesses with branding, media buying, and campaigns.
          </span>
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">
          Submit for Approval
        </button>
      </form>
      <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">What happens next?</h2>
        <div className="mt-4 grid gap-4">
          <Step number="1" title="Admin review" body="Tradia checks the listing before publishing it to the public directory." />
          <Step number="2" title="Complete your profile" body="Add photos, opening hours, documents, and richer contact details from your dashboard." />
          <Step number="3" title="Request verification" body="Submit proof documents when you are ready to earn a stronger trust signal." />
          <Step number="4" title="Increase visibility" body="Upgrade when you want more photos, analytics, featured eligibility, and better listing priority." />
        </div>
        <Link href="/pricing" className="mt-5 inline-flex rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink">
          Compare visibility plans
        </Link>
      </aside>
      </div>
    </main>
  );
}

function OnboardingBenefit({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <strong className="text-ink">{title}</strong>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-forest">
        {number}
      </span>
      <div>
        <strong>{title}</strong>
        <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </div>
  );
}
