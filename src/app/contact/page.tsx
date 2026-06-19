import type { Metadata } from "next";
import { Clock3, MessageCircle, Send, ShieldCheck, UsersRound } from "lucide-react";
import { SupportShell } from "@/components/support-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupportRequestAction } from "./actions";
import { createHumanChallenge } from "@/lib/human-verification";

export const metadata: Metadata = {
  title: "Contact Us | Support",
  description: "Contact Tradia for business listing support, verification help, payments, and platform enquiries.",
  alternates: { canonical: "/contact" }
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const challenge = createHumanChallenge();

  return (
    <SupportShell eyebrow="Contact Us" title="Talk to the Tradia team" intro="Send your question securely to the support centre. We will reply to the email address you provide.">
      <form id="support-form" action={createSupportRequestAction} className="grid gap-5 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-forest"><Send aria-hidden="true" className="h-5 w-5" /></span>
          <div><h2 className="text-xl font-black text-ink">Send a support request</h2><p className="mt-1 text-sm text-slate-600">Include the affected business, page, or payment reference where relevant.</p></div>
        </div>
        {params.sent ? <p className="rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">Your request has reached the Tradia support centre.</p> : null}
        {params.error ? <p className="rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{supportError(params.error)}</p> : null}
        <input className="hidden" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <input type="hidden" name="humanToken" value={challenge.token} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={user?.name} required />
          <Field label="Reply email" name="email" type="email" defaultValue={user?.email} required />
          <Field label="Phone (optional)" name="phone" defaultValue={user?.phone ?? ""} />
          <label className="grid gap-2 text-sm font-bold text-slate-600">Topic
            <select className="rounded-tradia border border-slate-200 px-4 py-3" name="topic">
              {["Account help", "Business listing", "Verification", "Payment or wallet", "Partnership", "Technical issue", "Other"].map((topic) => <option key={topic}>{topic}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-600">How can we help?
          <textarea className="min-h-36 rounded-tradia border border-slate-200 px-4 py-3" name="message" minLength={15} maxLength={3000} required />
        </label>
        <div className="grid gap-4 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-[1fr_180px] sm:items-end">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
            <div>
              <p className="text-sm font-black text-ink">Human verification</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Answer this quick question to help us prevent automated spam.</p>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            {challenge.question}
            <input className="rounded-tradia border border-emerald-200 bg-white px-4 py-3" name="humanAnswer" inputMode="numeric" pattern="[0-9]+" required autoComplete="off" />
          </label>
        </div>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Send to support centre</button>
      </form>
      <div className="mt-5 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <Info icon={Clock3} title="Help us respond faster" body="Include your account email, business name, affected page, and any payment or request reference." />
        <Info icon={UsersRound} title="Company" body="Tradia is operated by Zamkah Technologies Limited." />
      </div>
      <a href="https://wa.me/2349055091300" className="mt-5 flex items-center gap-3 rounded-tradia border border-slate-200 bg-white p-5 font-black text-forest shadow-sm"><MessageCircle className="h-5 w-5" />Ask a short question on WhatsApp</a>
    </SupportShell>
  );
}

function supportError(error: string) {
  if (error === "verification") return "Please answer the human verification question correctly and try again.";
  if (error === "rate-limit") return "Too many support requests were submitted. Please wait an hour before trying again.";
  return "Please complete your name, valid email, and a clear message of at least 15 characters.";
}

function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-600">{label}<input className="rounded-tradia border border-slate-200 px-4 py-3" name={name} type={type} defaultValue={defaultValue} required={required} /></label>;
}

function Info({ icon: Icon, title, body }: { icon: typeof Clock3; title: string; body: string }) {
  return <div className="flex gap-3"><Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-forest" /><div><h2 className="font-black text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{body}</p></div></div>;
}
