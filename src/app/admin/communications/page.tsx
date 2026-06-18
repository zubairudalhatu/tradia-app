import { redirect } from "next/navigation";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normalizeNigerianPhone } from "@/lib/phone";
import { sendBroadcastAction } from "../actions";

type CommunicationsPageProps = {
  searchParams: Promise<{ broadcast?: string; delivered?: string; attempted?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CommunicationsPage({ searchParams }: CommunicationsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");

  const [emailUsers, phoneUsers, activeUsers] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.findMany({
      where: { status: "ACTIVE", phone: { not: null } },
      select: { phone: true }
    }),
    prisma.user.count({ where: { status: "ACTIVE" } })
  ]);
  const contactablePhoneUsers = phoneUsers.filter((candidate) => normalizeNigerianPhone(candidate.phone)).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Admin communications</p>
      <h1 className="mt-1 break-words text-3xl font-black leading-tight text-ink sm:text-4xl">Registered-user broadcasts</h1>
      <p className="mt-2 max-w-3xl leading-7 text-slate-600">
        Send necessary Tradia service and account updates through one available channel at a time.
      </p>

      {params.broadcast ? (
        <p className={`mt-6 rounded-tradia border p-4 text-sm font-bold ${
          params.broadcast === "sent" ? "border-emerald-200 bg-emerald-50 text-forest" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {resultMessage(params.broadcast, params.delivered, params.attempted)}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="grid content-start gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Metric value={activeUsers} label="Active registered users" />
          <Metric value={emailUsers} label="Eligible for email" />
          <Metric value={contactablePhoneUsers} label="Eligible for SMS or WhatsApp" />
        </section>
        <form action={sendBroadcastAction} className="grid gap-4 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <input type="hidden" name="adminActionToken" value={createAdminActionToken(user)} />
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Delivery channel
            <select className="rounded-tradia border border-slate-200 px-4 py-3" name="channel" required>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Audience
            <select className="rounded-tradia border border-slate-200 px-4 py-3" name="audience" required>
              <option value="ALL_ACTIVE">All active registered users</option>
              <option value="BUSINESS_OWNERS">Registered business owners</option>
              <option value="REGULAR_USERS">Users without a business</option>
              <option value="BUSINESS_CONTACTS">Registered business contacts</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
            Email subject
            <input className="rounded-tradia border border-slate-200 px-4 py-3" name="subject" maxLength={120} placeholder="Required when sending email" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
            Message
            <textarea className="min-h-40 rounded-tradia border border-slate-200 px-4 py-3" name="message" minLength={10} maxLength={500} required />
            <span className="text-xs font-semibold text-slate-500">Maximum 500 characters. Each send reaches up to 250 eligible users.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">
            Type SEND to confirm
            <input className="rounded-tradia border border-slate-200 px-4 py-3" name="confirmation" pattern="SEND" required autoComplete="off" />
          </label>
          <p className="rounded-tradia bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800 md:col-span-2">
            Phone broadcasts reach active users who supplied a valid Nigerian number. Promotional campaigns should wait until user marketing preferences and unsubscribe controls are available.
          </p>
          <button className="rounded-tradia bg-forest px-5 py-3 font-black text-white md:col-span-2">Send Broadcast</button>
        </form>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <article className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
      <strong className="block text-3xl font-black text-ink">{value.toLocaleString("en-NG")}</strong>
      <span className="text-sm font-bold text-slate-500">{label}</span>
    </article>
  );
}

function resultMessage(status: string, delivered?: string, attempted?: string) {
  if (status === "sent") return `Broadcast completed: ${delivered ?? "0"} of ${attempted ?? "0"} eligible recipients accepted for delivery.`;
  return "Broadcast was not sent. Complete every required field and type SEND exactly to confirm.";
}
