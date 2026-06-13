import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type UsersPageProps = { searchParams: Promise<{ q?: string }> };

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const q = params.q?.trim();
  const users = await prisma.user.findMany({
    where: q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } }
    ] } : {},
    include: { _count: { select: { businesses: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  const token = createAdminActionToken(user);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Admin directory</p>
      <h1 className="mt-1 text-4xl font-black text-ink">Users</h1>
      <form action="/admin/users" className="mt-6 grid gap-3 rounded-tradia border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <input className="rounded-tradia border border-slate-200 px-4 py-3" name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, or phone" />
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Search users</button>
      </form>
      <section className="mt-6 divide-y divide-slate-200 rounded-tradia border border-slate-200 bg-white shadow-sm">
        {users.map((item) => (
          <article key={item.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-black text-ink">{item.name}</h2>
              <p className="text-sm text-slate-600">{item.email}{item.phone ? ` - ${item.phone}` : ""}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.role.replaceAll("_", " ")} - {item.status} - {item._count.businesses} businesses - {item._count.reviews} reviews</p>
            </div>
            <Link className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/users/${item.id}?adminActionToken=${encodeURIComponent(token)}`}>Edit user</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
