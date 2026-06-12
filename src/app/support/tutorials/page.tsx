import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, Megaphone, UserRoundCheck } from "lucide-react";
import { SupportShell } from "@/components/support-shell";

export const metadata: Metadata = {
  title: "Tutorials | Support",
  description: "Step-by-step Tradia tutorials for listing, managing, verifying, and promoting a business.",
  alternates: { canonical: "/support/tutorials" }
};

const tutorials = [
  {
    title: "List a business for free",
    icon: Building2,
    steps: ["Create or sign in to your Tradia account.", "Choose List Your Business Free.", "Add accurate business and contact details.", "Submit the listing for review."],
    href: "/businesses/new",
    cta: "Start a business listing"
  },
  {
    title: "Complete your business profile",
    icon: UserRoundCheck,
    steps: ["Open Business from the main navigation.", "Choose the listing you manage.", "Add a logo, cover image, description, hours, and contact links.", "Keep details current so customers can trust them."],
    href: "/dashboard",
    cta: "Open business dashboard"
  },
  {
    title: "Request verification",
    icon: BadgeCheck,
    steps: ["Use a plan that is eligible for verification review.", "Open your business management page.", "Submit clear supporting documents.", "Wait for Tradia admin review and respond if more proof is requested."],
    href: "/verification-policy",
    cta: "Read verification policy"
  },
  {
    title: "Grow profile visibility",
    icon: Megaphone,
    steps: ["Complete the profile before promoting it.", "Share the profile link or QR poster with customers.", "Request genuine customer reviews.", "Use an eligible plan or featured placement when ready."],
    href: "/pricing",
    cta: "Explore visibility plans"
  }
];

export default function TutorialsPage() {
  return (
    <SupportShell
      eyebrow="Tutorials"
      title="Practical guides for using Tradia"
      intro="Follow these short guides to build a credible profile and get more value from the directory."
    >
      <div className="grid gap-5">
        {tutorials.map(({ title, icon: Icon, steps, href, cta }) => (
          <article key={title} className="rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-forest">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black text-ink">{title}</h2>
            </div>
            <ol className="mt-5 grid gap-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-ink">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Link href={href} className="mt-5 inline-flex rounded-tradia bg-slate-100 px-4 py-3 text-sm font-black text-ink hover:bg-emerald-50 hover:text-forest">
              {cta}
            </Link>
          </article>
        ))}
      </div>
    </SupportShell>
  );
}
