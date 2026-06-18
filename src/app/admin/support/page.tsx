import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateSupportRequestAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/support");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const requests = await prisma.supportRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Support centre</p>
      <h1 className="mt-1 break-words text-3xl font-black leading-tight text-ink sm:text-4xl">Support requests</h1>
      <p className="mt-2 text-slate-600">Review enquiries submitted through the Tradia contact form.</p>
      <section className="mt-6 divide-y divide-slate-200 rounded-tradia border border-slate-200 bg-white shadow-sm">
        {requests.length ? requests.map((request) => (
          <article key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_220px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-ink">{request.topic}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{request.status.replace("_", " ")}</span></div>
              <p className="mt-1 break-words text-sm font-bold text-slate-600">{request.name} · {request.email}{request.phone ? ` · ${request.phone}` : ""}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.message}</p>
              <p className="mt-3 text-xs text-slate-500">{request.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} · Ref: {request.id}</p>
            </div>
            <form action={updateSupportRequestAction.bind(null, request.id)} className="grid content-start gap-3">
              <select className="rounded-tradia border border-slate-200 px-3 py-3 text-sm" name="status" defaultValue={request.status}>
                <option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="SPAM">Spam</option>
              </select>
              <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-black text-white">Update status</button>
            </form>
          </article>
        )) : <p className="p-5 text-sm text-slate-600">No support requests yet.</p>}
      </section>
    </main>
  );
}
