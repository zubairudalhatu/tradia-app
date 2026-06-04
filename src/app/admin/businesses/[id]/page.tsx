import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminActionToken, getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listActiveCategories } from "@/lib/queries/categories";
import { listActiveStateAreaGroups } from "@/lib/queries/locations";
import {
  grantLifetimeVerificationAction,
  revokeLifetimeVerificationAction,
  updateAdminBusinessAction
} from "./actions";

type AdminBusinessPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adminActionToken?: string; error?: string; saved?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminBusinessPage({ params, searchParams }: AdminBusinessPageProps) {
  const [{ id }, query, sessionAdmin, categories, locationGroups, users, plans] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    listActiveCategories(),
    listActiveStateAreaGroups(),
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { annualPrice: "asc" } })
  ]);
  const admin = sessionAdmin ?? await getAdminFromActionToken(query.adminActionToken);

  if (!admin) redirect(`/login?next=/admin/businesses/${id}`);
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(admin.role)) redirect("/dashboard");

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      owner: true,
      plan: true,
      media: {
        orderBy: { createdAt: "desc" },
        take: 6
      },
      verificationRequests: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!business) redirect("/admin?error=business-not-found");

  const action = updateAdminBusinessAction.bind(null, business.id);
  const grantVerificationAction = grantLifetimeVerificationAction.bind(null, business.id);
  const revokeVerificationAction = revokeLifetimeVerificationAction.bind(null, business.id);
  const adminActionToken = createAdminActionToken(admin);

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/admin" className="text-sm font-bold text-forest">Back to admin</Link>
      <p className="mt-6 text-sm font-extrabold uppercase text-ember">Business Management</p>
      <h1 className="text-5xl font-black tracking-normal">Edit {business.name}</h1>

      {query.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          {successMessage(query.saved)}
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {query.error === "invalid"
            ? "Could not save this business. Description must be at least 20 characters, and all required fields must be completed."
            : query.error === "slug-taken"
              ? "That business page username is already in use. Please choose another one."
            : "Could not save this business. Check required fields and unique contact values."}
        </p>
      ) : null}

      <form action={action} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input type="hidden" name="adminActionToken" value={adminActionToken} />
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
            Public URL text for this listing. Use lowercase letters, numbers, and hyphens only.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Owner
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="ownerId" defaultValue={business.ownerId ?? ""}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
            ))}
          </select>
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
          Listing status
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="listingStatus" defaultValue={business.listingStatus}>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Verification status
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="verificationStatus" defaultValue={business.verificationStatus}>
            <option value="UNVERIFIED">Unverified</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Plan
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="planId" defaultValue={business.planId ?? ""}>
            <option value="">No plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Address
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="address" defaultValue={business.address} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" defaultValue={business.phone ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          WhatsApp
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="whatsapp" defaultValue={business.whatsapp ?? ""} />
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
            Minimum 20 characters so the listing has enough detail for visitors.
          </span>
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">Save Business</button>
      </form>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase text-ember">Lifetime verification</p>
            <h2 className="mt-1 text-2xl font-black">Admin-assigned verification</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A verified business stays verified indefinitely until an admin revokes it. This is separate from temporary verification request review history.
            </p>
            <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600 md:grid-cols-2">
              <span className="rounded-tradia bg-slate-50 px-3 py-2">Current status: {business.verificationStatus}</span>
              <span className="rounded-tradia bg-slate-50 px-3 py-2">
                Granted: {business.verificationGrantedAt ? business.verificationGrantedAt.toLocaleDateString("en-NG", { dateStyle: "medium" }) : "Not granted"}
              </span>
              <span className="rounded-tradia bg-slate-50 px-3 py-2">
                Revoked: {business.verificationRevokedAt ? business.verificationRevokedAt.toLocaleDateString("en-NG", { dateStyle: "medium" }) : "Not revoked"}
              </span>
              <span className="rounded-tradia bg-slate-50 px-3 py-2">
                Source: {business.verificationGrantedBy ? "Admin assigned" : "Status only"}
              </span>
            </div>
          </div>
          <div className="grid gap-3">
            {business.verificationStatus === "VERIFIED" ? (
              <div className="w-full rounded-tradia bg-emerald-50 px-5 py-3 text-center text-sm font-black text-forest">
                Lifetime Verification Granted
              </div>
            ) : (
              <form action={grantVerificationAction}>
                <input type="hidden" name="adminActionToken" value={adminActionToken} />
                <button className="w-full rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">
                  Grant Lifetime Verification
                </button>
              </form>
            )}
            <form action={revokeVerificationAction}>
              <input type="hidden" name="adminActionToken" value={adminActionToken} />
              <button className="w-full rounded-tradia bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
                Revoke Verification
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Recent uploads</h2>
          <div className="mt-4 grid gap-3">
            {business.media.length ? business.media.map((item) => (
              <a key={item.id} href={item.url} target="_blank" className="rounded-tradia border border-slate-200 p-3 text-sm font-bold text-forest">
                {item.type} - Uploaded file
              </a>
            )) : (
              <p className="text-sm text-slate-600">No uploads yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Verification history</h2>
          <div className="mt-4 grid gap-3">
            {business.verificationRequests.length ? business.verificationRequests.map((request) => (
              <a key={request.id} href={request.documentUrl} target="_blank" className="rounded-tradia border border-slate-200 p-3 text-sm">
                <strong className="block text-ink">{request.documentType}</strong>
                <span className="text-slate-600">{request.status} - {new Date(request.createdAt).toLocaleDateString()}</span>
              </a>
            )) : (
              <p className="text-sm text-slate-600">No verification requests yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function successMessage(value: string) {
  if (value === "verification-granted") return "Lifetime verification granted.";
  if (value === "verification-revoked") return "Verification revoked.";
  return "Business updated.";
}
