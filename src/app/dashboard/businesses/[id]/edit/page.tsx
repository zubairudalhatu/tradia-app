import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveAreas } from "@/lib/queries/locations";
import {
  respondToReviewAction,
  submitVerificationRequestAction,
  updateBusinessProfileAction,
  uploadBusinessMediaAction
} from "./actions";

type EditBusinessPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; media?: string; verification?: string; response?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({ params, searchParams }: EditBusinessPageProps) {
  const [{ id }, query, user, categories, locations] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    listActiveCategories(),
    listActiveAreas()
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
  const mediaAction = uploadBusinessMediaAction.bind(null, business.id);
  const verificationAction = submitVerificationRequestAction.bind(null, business.id);
  const responseAction = respondToReviewAction.bind(null, business.id);

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Business Dashboard</p>
      <h1 className="text-5xl font-black tracking-normal">Edit {business.name}</h1>
      <p className="mt-4 text-lg text-slate-600">
        Update public profile details. Approval and verification status are still controlled by Tradia admins.
      </p>

      {query.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Business profile saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Please check the required fields and try again.
        </p>
      ) : null}
      {query.media ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Media uploaded successfully.
        </p>
      ) : null}
      {query.verification ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Verification request submitted for admin review.
        </p>
      ) : null}
      {query.response ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Review response saved.
        </p>
      ) : null}

      <form action={action} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Business name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={business.name} required />
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
          Area
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="locationId" defaultValue={business.locationId} required>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
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
          <textarea className="min-h-32 rounded-tradia border border-slate-200 px-4 py-3" name="description" defaultValue={business.description} required />
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
        <h2 className="text-2xl font-black">Media</h2>
        <p className="mt-1 text-sm text-slate-600">Upload a logo, cover image, gallery photo, menu, brochure, or document.</p>
        <form action={mediaAction} className="mt-5 grid gap-4 md:grid-cols-[180px_1fr_auto]" encType="multipart/form-data">
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="mediaType" defaultValue="GALLERY">
            <option value="LOGO">Logo</option>
            <option value="COVER">Cover</option>
            <option value="GALLERY">Gallery</option>
            <option value="MENU">Menu</option>
            <option value="BROCHURE">Brochure</option>
            <option value="DOCUMENT">Document</option>
          </select>
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
          <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Upload</button>
        </form>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {business.media.length ? business.media.map((item) => (
            <a key={item.id} href={item.url} target="_blank" className="rounded-tradia border border-slate-200 p-4 text-sm">
              <strong className="block text-ink">{item.type}</strong>
              <span className="text-slate-600">{item.title ?? item.url}</span>
            </a>
          )) : (
            <p className="text-sm text-slate-600">No media uploaded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Verification</h2>
        <p className="mt-1 text-sm text-slate-600">Submit proof documents so admins can mark this business as verified.</p>
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
