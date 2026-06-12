import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, Mail, MessageSquareWarning } from "lucide-react";
import { SupportShell } from "@/components/support-shell";

export const metadata: Metadata = {
  title: "Report Abuse | Support",
  description: "Report misleading listings, harmful reviews, impersonation, fraud, or other safety concerns to Tradia.",
  alternates: { canonical: "/support/report-abuse" }
};

export default function ReportAbusePage() {
  return (
    <SupportShell
      eyebrow="Safety"
      title="Report abuse or a safety concern"
      intro="Help Tradia protect customers and legitimate businesses by reporting misleading, harmful, fraudulent, or unlawful content."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ReportOption
          icon={Building2}
          title="Report a business listing"
          body="Open the affected business profile and use Report listing. This links your report directly to the correct business."
          href="/businesses"
          cta="Find the business"
        />
        <ReportOption
          icon={MessageSquareWarning}
          title="Report a review"
          body="Open the affected business profile and use Report beside the review. You must be signed in to submit it."
          href="/businesses"
          cta="Browse businesses"
        />
        <ReportOption
          icon={AlertTriangle}
          title="Fraud, impersonation, or urgent harm"
          body="Email Tradia with the relevant URL, screenshots, and a clear description. Do not include passwords, OTPs, or full payment-card details."
          href="mailto:tradia@zamkah.com.ng?subject=Tradia%20abuse%20report"
          cta="Email an abuse report"
        />
        <ReportOption
          icon={Mail}
          title="Other policy concerns"
          body="For concerns that are not tied to one listing or review, contact the support team and explain what happened."
          href="/contact"
          cta="Contact support"
        />
      </div>
      <div className="mt-5 rounded-tradia border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-slate-700">
        <strong className="text-ink">Immediate danger:</strong> Contact the appropriate local emergency or law-enforcement service first. Tradia support cannot provide emergency assistance.
      </div>
    </SupportShell>
  );
}

function ReportOption({
  icon: Icon,
  title,
  body,
  href,
  cta
}: {
  icon: typeof Building2;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="flex min-h-64 flex-col rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-red-700">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-xl font-black text-ink">{title}</h2>
      <p className="mt-2 leading-7 text-slate-600">{body}</p>
      <Link href={href} className="mt-auto pt-5 text-sm font-black text-forest hover:text-ink">
        {cta}
      </Link>
    </article>
  );
}
