import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState, isPhotoMediaType } from "@/lib/plans/benefits";
import { getBusinessProfileCompleteness } from "@/lib/profile-completeness";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";
import {
  respondToReviewAction,
  submitVerificationRequestAction,
  updateBusinessProfileAction
} from "./actions";

type EditBusinessPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; media?: string; verification?: string; response?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({ params, searchParams }: EditBusinessPageProps) {
  const [{ id }, query, user, categories, locationGroups] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    listActiveCategories(),
    listActiveStateAreaGroups()
  ]);

  if (!user) redirect(`/login?next=/dashboard/businesses/${id}/edit`);

  const business = await prisma.business.findFirst({
    where: {
      id,
      ownerId: user.id
    },
    include: {
      category: true,
      location: true,
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      },
      media: {
        orderBy: { createdAt: "desc" }
      },
      verificationRequests: {
        orderBy: { createdAt: "desc" },
        take: 5
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!business) redirect("/dashboard?error=business-not-found");

  const action = updateBusinessProfileAction.bind(null, business.id);
  const verificationAction = submitVerificationRequestAction.bind(null, business.id);
  const responseAction = respondToReviewAction.bind(null, business.id);
  const completeness = getBusinessProfileCompleteness(business);
  const planState = getBusinessPlanState(business);
  const benefits = planState.benefits;
  const photoCount = business.media.filter((item) => isPhotoMediaType(item.type)).length;

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Business Dashboard</p>
      <h1 className="text-5xl font-black tracking-normal">Edit {business.name}</h1>
      <p className="mt-4 text-lg text-slate-600">
        Update public profile details. Approval and verification status are still controlled by Tradia admins.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-sm font-black text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">{benefits.name} plan</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{photoCount}/{benefits.maxPhotos} photos used</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{benefits.analyticsEnabled ? "Analytics enabled" : "Analytics locked"}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{benefits.canBeFeatured ? "Featured eligible" : "Featured locked"}</span>
        {planState.activeSubscription ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-forest">
            Active until {planState.activeSubscription.endsAt.toLocaleDateString()}
          </span>
        ) : null}
        {planState.isExpired ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Subscription expired</span>
        ) : null}
      </div>

      {query.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Business profile saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage(query.error)}
        </p>
      ) : null}
      {query.verification ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          {query.verification === "already-verified"
            ? "This business already has lifetime verification."
            : "Verification request submitted for admin review."}
        </p>
      ) : null}
      {query.response ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Review response saved.
        </p>
      ) : null}

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Profile completeness</h2>
            <p className="mt-1 text-sm text-slate-600">Complete profiles look more credible and convert more visitors into enquiries.</p>
          </div>
          <strong className="text-4xl font-black text-forest">{completeness.percentage}%</strong>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-forest" style={{ width: `${completeness.percentage}%` }} />
        </div>
        {completeness.missing.length ? (
          <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {completeness.missing.slice(0, 6).map((item) => (
              <span key={item} className="rounded-tradia bg-slate-50 px-3 py-2 font-bold">{item}</span>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-tradia bg-emerald-50 p-3 text-sm font-bold text-forest">
            This profile is in excellent shape.
          </p>
        )}
      </section>

      <form action={action} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Business name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={business.name} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Business page username
          <div className="flex overflow-hidden rounded-tradia border border-slate-200 bg-white">
            <span className="flex items-center bg-slate-50 px-3 text-sm font-bold text-slate-500">tradia.business/businesses/</span>
            <input
              className="min-w-0 flex-1 px-4 py-3 outline-none"
              name="slug"
              defaultValue={business.slug}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              minLength={3}
              maxLength={80}
              required
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Use lowercase letters, numbers, and hyphens only. Example: in-flight-media-and-technologies-limited.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Category
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="categoryId" defaultValue={business.categoryId} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          State / Area
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="locationId" defaultValue={business.locationId} required>
            {locationGroups.map((state) => (
              <optgroup key={state.id} label={state.name}>
                {state.children.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Address
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="address" defaultValue={business.address} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          WhatsApp
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="whatsapp" defaultValue={business.whatsapp ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" defaultValue={business.phone ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="email" type="email" defaultValue={business.email ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Website
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="website" type="url" defaultValue={business.website ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
          Description
          <textarea
            className="min-h-32 rounded-tradia border border-slate-200 px-4 py-3"
            name="description"
            defaultValue={business.description}
            minLength={20}
            placeholder="Tell customers what this business offers. Minimum 20 characters."
            required
          />
          <span className="text-xs font-semibold text-slate-500">
            Minimum 20 characters so customers understand what the business offers.
          </span>
        </label>
        <div className="grid gap-2 rounded-tradia bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
          <span><strong>Status:</strong> {business.listingStatus.replace("_", " ")}</span>
          <span><strong>Verification:</strong> {business.verificationStatus}</span>
        </div>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">
          Save Profile
        </button>
      </form>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Profile photos</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Logo, cover photo positioning, gallery uploads, and media deletion now happen directly on the public business page so you can edit while seeing the page customers see.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/businesses/${business.slug}`} className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">
            Manage Photos on Public Page
          </Link>
          <span className="rounded-tradia bg-slate-100 px-4 py-3 text-sm font-black text-slate-600">
            {photoCount}/{benefits.maxPhotos} photos used
          </span>
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Verification</h2>
        <p className="mt-1 text-sm text-slate-600">
          {business.verificationStatus === "VERIFIED"
            ? "This business has lifetime verification. It remains verified unless an admin revokes it."
            : benefits.canRequestVerification
            ? "Submit proof documents so admins can mark this business as verified."
            : "Verification requests are available on Silver, Gold, and Platinum plans."}
        </p>
        {business.verificationStatus === "VERIFIED" ? (
          <div className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
            <span className="block">Verified by Tradia</span>
            <span className="mt-1 block text-forest/80">
              Granted {business.verificationGrantedAt ? business.verificationGrantedAt.toLocaleDateString("en-NG", { dateStyle: "medium" }) : "by admin review"}.
            </span>
          </div>
        ) : benefits.canRequestVerification ? (
          <form action={verificationAction} className="mt-5 grid gap-4 md:grid-cols-2" encType="multipart/form-data">
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Document type
            <select className="rounded-tradia border border-slate-200 px-4 py-3" name="documentType" required>
              <option value="CAC Certificate">CAC Certificate</option>
              <option value="Storefront Photo">Storefront Photo</option>
              <option value="Utility Bill">Utility Bill</option>
              <option value="Owner ID">Owner ID</option>
              <option value="Other Business Proof">Other Business Proof</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Proof file
            <input className="rounded-tradia border border-slate-200 px-4 py-3" name="document" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
            Notes
            <textarea className="min-h-24 rounded-tradia border border-slate-200 px-4 py-3" name="notes" placeholder="Anything admins should know about this proof?" />
          </label>
          <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">
            Submit Verification Request
          </button>
          </form>
        ) : (
          <Link className="mt-5 inline-flex rounded-tradia bg-forest px-5 py-3 font-bold text-white" href="/pricing">
            Upgrade for Verification
          </Link>
        )}
        <div className="mt-6 grid gap-3">
          {business.verificationRequests.length ? business.verificationRequests.map((request) => (
            <div key={request.id} className="rounded-tradia border border-slate-200 p-4 text-sm">
              <strong className="block text-ink">{request.documentType}</strong>
              <span className="text-slate-600">{request.status} - {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          )) : (
            <p className="text-sm text-slate-600">No verification requests submitted yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Published reviews</h2>
        <p className="mt-1 text-sm text-slate-600">Respond to customer reviews from your business profile.</p>
        <div className="mt-5 grid gap-4">
          {business.reviews.length ? business.reviews.map((review) => (
            <article key={review.id} className="rounded-tradia border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong>{review.title ?? "Customer review"}</strong>
                  <p className="text-sm text-slate-600">By {review.user.name}</p>
                </div>
                <span className="font-black text-forest">{review.rating}/5</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{review.body}</p>
              <form action={responseAction} className="mt-4 grid gap-3">
                <input type="hidden" name="reviewId" value={review.id} />
                <textarea
                  className="min-h-24 rounded-tradia border border-slate-200 px-3 py-2 text-sm"
                  name="ownerResponse"
                  defaultValue={review.ownerResponse ?? ""}
                  placeholder="Write an owner response"
                />
                <button className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white">
                  Save Response
                </button>
              </form>
            </article>
          )) : (
            <p className="text-sm text-slate-600">No published reviews yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function errorMessage(error: string) {
  if (error === "invalid") {
    return "Please check the required fields. Description must be at least 20 characters, and the business page username must use letters, numbers, and hyphens.";
  }

  if (error === "slug-taken") {
    return "That business page username is already in use. Please choose another one.";
  }

  if (error === "upload-storage") {
    return "Uploads are not configured yet. Please add Cloudinary credentials in Vercel before uploading media or verification documents.";
  }

  if (error === "media") {
    return "Please choose a valid PNG, JPG, WebP, or PDF file under 5MB.";
  }

  if (error === "verification") {
    return "Please choose a document type and upload a valid proof file.";
  }

  if (error === "verification-plan") {
    return "Verification requests are available on Silver, Gold, and Platinum plans.";
  }

  if (error === "photo-limit") {
    return "This business has reached the photo limit for its current plan. Please upgrade to upload more photos.";
  }

  if (error === "response") {
    return "Please write a response before saving.";
  }

  return "Please check the required fields and try again.";
}
