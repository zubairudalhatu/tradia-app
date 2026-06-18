import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createClaimAction } from "./actions";

type ClaimPageProps = {
  searchParams: Promise<{ businessId?: string; status?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim a Business Listing",
  description: "Claim a published Tradia business listing so admins can review ownership proof and connect the listing to your account.",
  robots: {
    index: false,
    follow: true
  }
};

export default async function ClaimBusinessPage({ searchParams }: ClaimPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (!params.businessId) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Claim listing</p>
        <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">Choose a business profile first</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Open the public business profile you want to claim, then use the claim button on that page.
        </p>
        <Link href="/businesses" className="mt-6 inline-flex rounded-tradia bg-forest px-5 py-3 font-bold text-white">
          Browse businesses
        </Link>
      </main>
    );
  }

  if (!user || user.status !== "ACTIVE") {
    redirect(`/login?next=${encodeURIComponent(`/claims/new?businessId=${params.businessId}`)}`);
  }

  const business = await prisma.business.findFirst({
    where: {
      id: params.businessId,
      listingStatus: "PUBLISHED"
    },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      category: {
        select: {
          name: true
        }
      },
      location: {
        select: {
          name: true
        }
      }
    }
  });

  if (!business) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">Claim listing</p>
        <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">Business not found</h1>
        <p className="mt-4 leading-7 text-slate-600">
          This listing may no longer be published. Please browse the directory and try again.
        </p>
        <Link href="/businesses" className="mt-6 inline-flex rounded-tradia bg-forest px-5 py-3 font-bold text-white">
          Browse businesses
        </Link>
      </main>
    );
  }

  if (business.ownerId === user.id) {
    redirect(`/businesses/${business.slug}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Claim listing</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">Claim {business.name}</h1>
      <p className="mt-4 leading-7 text-slate-600">
        Submit a short explanation and optional proof link. Tradia admins will review the claim before assigning ownership.
      </p>

      {params.status === "invalid" ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Please add a message of at least 10 characters. Proof links must be valid URLs.
        </p>
      ) : null}

      <section className="mt-6 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase text-slate-400">Business</p>
        <h2 className="mt-1 text-2xl font-black">{business.name}</h2>
        <p className="mt-2 text-sm font-bold text-slate-600">
          {business.category.name} in {business.location.name}
        </p>
      </section>

      <form action={createClaimAction} className="mt-6 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="businessId" value={business.id} />
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Why should this listing be assigned to you?
          <textarea
            className="min-h-32 rounded-tradia border border-slate-200 px-3 py-3 text-sm"
            name="message"
            placeholder="Example: I am the owner/manager of this business. I can provide CAC documents, storefront proof, or official contact confirmation."
            required
            minLength={10}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Proof URL
          <input
            className="rounded-tradia border border-slate-200 px-3 py-3 text-sm"
            name="proofUrl"
            type="url"
            placeholder="https://..."
          />
          <span className="text-xs font-semibold text-slate-500">
            Optional: link to a document, company page, social profile, or public proof connected to the business.
          </span>
        </label>
        <button className="rounded-tradia bg-forest px-4 py-3 font-bold text-white">
          Submit Claim
        </button>
      </form>
    </main>
  );
}
