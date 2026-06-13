import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type BusinessesPageProps = { searchParams: Promise<{ q?: string; status?: string }> };

export const dynamic = "force-dynamic";

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const q = params.q?.trim();
  const status = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"].includes(params.status ?? "") ? params.status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" : undefined;
  const businesses = await prisma.business.findMany({
    where: {
      ...(status ? { listingStatus: status } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { owner: { name: { contains: q, mode: "insensitive" } } },
        { owner: { email: { contains: q, mode: "insensitive" } } }
      ] } : {})
    },
    include: { category: true, location: true, owner: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  const token = createAdminActionToken(user);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Admin directory</p>
      <h1 className="mt-1 text-4xl font-black text-ink">Businesses</h1>
      <form action="/admin/businesses" className="mt-6 grid gap-3 rounded-tradia border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <input className="rounded-tradia border border-slate-200 px-4 py-3" name="q" defaultValue={params.q ?? ""} placeholder="Search business, owner, or address" />
        <select className="rounded-tradia border border-slate-200 px-4 py-3" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option><option value="PENDING_REVIEW">Pending review</option><option value="PUBLISHED">Published</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option>
        </select>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Apply filters</button>
      </form>
      <section className="mt-6 divide-y divide-slate-200 rounded-tradia border border-slate-200 bg-white shadow-sm">
        {businesses.map((item) => (
          <article key={item.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-black text-ink">{item.name}</h2>
              <p className="text-sm text-slate-600">{item.category.name} in {item.location.name}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.listingStatus.replaceAll("_", " ")} - {item.verificationStatus} - Owner: {item.owner?.name ?? "Unassigned"}</p>
            </div>
            <Link className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href={`/admin/businesses/${item.id}?adminActionToken=${encodeURIComponent(token)}`}>Edit business</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
