import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { approveClaimAction, rejectClaimAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string; error?: string }> }) {
  const [admin, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!admin) redirect("/login?next=/admin/claims");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(admin.role)) redirect("/dashboard");

  const status = normalizeStatus(params.status);
  const claims = await prisma.businessClaim.findMany({
    where: status ? { status } : {},
    include: { business: { include: { owner: true } }, user: true, reviewer: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  const canTransfer = admin.role === "ADMIN" || admin.role === "SUPER_ADMIN";

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Ownership review</p>
      <h1 className="mt-1 text-4xl font-black text-ink">Business claims</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Review the claimant, explanation, and proof before transferring a listing. Approval immediately replaces the current owner.</p>
      {params.saved ? <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">Claim {params.saved} successfully.</p> : null}
      {params.error ? <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{claimError(params.error)}</p> : null}

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Claim status filters">
        {[['PENDING', 'Pending'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['ALL', 'All']].map(([value, label]) => (
          <Link key={label} href={`/admin/claims?status=${value}`} className={`rounded-tradia px-4 py-2 text-sm font-black ${status === value || (!status && value === "ALL") ? "bg-forest text-white" : "bg-slate-100 text-ink"}`}>{label}</Link>
        ))}
      </nav>

      <section className="mt-6 grid gap-5">
        {claims.length ? claims.map((claim) => (
          <article key={claim.id} className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-ink">{claim.business.name}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{claim.status}</span></div>
                <p className="mt-2 text-sm text-slate-600">Claimant: <strong>{claim.user.name}</strong> · {claim.user.email}{claim.user.phone ? ` · ${claim.user.phone}` : ""}</p>
                <p className="mt-1 text-sm text-slate-600">Current owner: {claim.business.owner ? `${claim.business.owner.name} · ${claim.business.owner.email}` : "Unassigned"}</p>
                <p className="mt-4 whitespace-pre-wrap rounded-tradia bg-slate-50 p-4 text-sm leading-6 text-slate-700">{claim.message || "No explanation provided."}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
                  <Link href={`/businesses/${claim.business.slug}`} target="_blank" className="text-forest">Open business profile</Link>
                  {claim.proofUrl ? <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="text-forest">Open ownership proof</a> : <span className="text-amber-700">No proof link supplied</span>}
                </div>
                <p className="mt-4 text-xs text-slate-500">Submitted {claim.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}{claim.reviewer ? ` · Reviewed by ${claim.reviewer.name}` : ""}</p>
                {claim.adminNotes ? <p className="mt-2 text-sm font-bold text-slate-600">Admin note: {claim.adminNotes}</p> : null}
              </div>
              {claim.status === "PENDING" ? (
                <div className="grid content-start gap-3 rounded-tradia border border-slate-200 p-4">
                  <p className="text-sm font-black text-ink">Review decision</p>
                  <form action={canTransfer ? approveClaimAction.bind(null, claim.id) : rejectClaimAction.bind(null, claim.id)} className="grid gap-3">
                    <textarea name="adminNotes" maxLength={1000} className="min-h-24 rounded-tradia border border-slate-200 p-3 text-sm" placeholder="Admin note or reason" />
                    {canTransfer ? <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-black text-white">Approve and transfer ownership</button> : null}
                    <button formAction={rejectClaimAction.bind(null, claim.id)} className="rounded-tradia bg-red-50 px-4 py-3 text-sm font-black text-red-700">Reject claim</button>
                  </form>
                  {!canTransfer ? <p className="text-xs text-slate-500">Only an Admin or Super Admin can transfer ownership.</p> : null}
                </div>
              ) : null}
            </div>
          </article>
        )) : <p className="rounded-tradia border border-slate-200 bg-white p-6 text-sm text-slate-600">No claims match this filter.</p>}
      </section>
    </main>
  );
}

function normalizeStatus(value?: string) {
  if (value === "ALL") return null;
  return ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(value || "") ? value as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" : "PENDING";
}

function claimError(error: string) {
  if (error === "inactive-user") return "The claimant account is not active, so ownership cannot be transferred.";
  if (error === "permission") return "Only an Admin or Super Admin can transfer business ownership.";
  if (error === "processed") return "This claim has already been reviewed.";
  return "The claim could not be updated. Please try again.";
}
