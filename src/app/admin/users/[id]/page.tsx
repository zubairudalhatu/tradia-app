import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminActionToken, getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateAdminUserAction } from "./actions";

type AdminUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adminActionToken?: string; error?: string; saved?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params, searchParams }: AdminUserPageProps) {
  const [{ id }, query, sessionAdmin] = await Promise.all([params, searchParams, getCurrentUser()]);
  const admin = sessionAdmin ?? await getAdminFromActionToken(query.adminActionToken);

  if (!admin) redirect(`/login?next=/admin/users/${id}`);
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(admin.role)) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      businesses: {
        include: { category: true, location: true },
        orderBy: { updatedAt: "desc" }
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!user) redirect("/admin?error=user-not-found");

  const action = updateAdminUserAction.bind(null, user.id);
  const adminActionToken = createAdminActionToken(admin);

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/admin" className="text-sm font-bold text-forest">Back to admin</Link>
      <p className="mt-6 text-sm font-extrabold uppercase text-ember">User Management</p>
      <h1 className="text-5xl font-black tracking-normal">Edit {user.name}</h1>

      {query.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          User updated.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Could not save this user. Check the name and phone number.
        </p>
      ) : null}

      <form action={action} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input type="hidden" name="adminActionToken" value={adminActionToken} />
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={user.name} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 bg-slate-50 px-4 py-3" value={user.email} disabled />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" defaultValue={user.phone ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Role
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="role" defaultValue={user.role}>
            <option value="USER">User</option>
            <option value="BUSINESS_OWNER">Business Owner</option>
            <option value="AGENT">Agent</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Status
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="status" defaultValue={user.status}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DELETED">Deleted</option>
          </select>
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white md:col-span-2">Save User</button>
      </form>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Owned businesses</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {user.businesses.length ? user.businesses.map((business) => (
            <article key={business.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-black">{business.name}</h3>
                <p className="text-sm text-slate-600">{business.category.name} in {business.location.name} - {business.listingStatus.replace("_", " ")}</p>
              </div>
              <Link className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/businesses/${business.id}?adminActionToken=${encodeURIComponent(adminActionToken)}`}>
                Edit Business
              </Link>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No businesses owned by this user.</p>
          )}
        </div>
      </section>
    </main>
  );
}
