import type { Metadata } from "next";
import { Clock3, Mail, MessageCircle, UsersRound } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { SupportShell } from "@/components/support-shell";

export const metadata: Metadata = {
  title: "Contact Us | Support",
  description: "Contact Tradia for business listing support, verification help, payments, and platform enquiries.",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactPage() {
  return (
    <SupportShell
      eyebrow="Contact Us"
      title="Talk to the Tradia team"
      intro="Get help with your account, business listing, verification request, payment, partnership, or a technical issue."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ContactOption
          icon={Mail}
          title="Email support"
          body="Best for account, verification, billing, technical, and partnership enquiries."
          href="mailto:tradia@zamkah.com.ng"
          label="tradia@zamkah.com.ng"
        />
        <ContactOption
          icon={MessageCircle}
          title="WhatsApp"
          body="Best for short questions and guidance during business hours."
          href="https://wa.me/2349055091300"
          label="+234 905 509 1300"
        />
      </div>
      <div className="mt-5 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="flex gap-3">
          <Clock3 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-forest" />
          <div>
            <h2 className="font-black text-ink">Help us respond faster</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Include your account email, business name, affected page, and any payment or request reference.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <UsersRound aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-forest" />
          <div>
            <h2 className="font-black text-ink">Company</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Tradia is operated by Zamkah Technologies Limited.</p>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-black text-ink">Follow Tradia</h2>
        <SocialLinks className="mt-3 text-forest" showHandle />
      </div>
    </SupportShell>
  );
}

function ContactOption({
  icon: Icon,
  title,
  body,
  href,
  label
}: {
  icon: typeof Mail;
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <a href={href} className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm transition hover:border-forest hover:shadow-lg">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-forest">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-xl font-black text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <span className="mt-5 block break-words text-sm font-black text-forest">{label}</span>
    </a>
  );
}
