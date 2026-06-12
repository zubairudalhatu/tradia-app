import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Mail, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Tradia business listings, accounts, verification, billing, safety reports, and platform features.",
  alternates: { canonical: "/support" }
};

const supportOptions = [
  {
    href: "/support/tutorials",
    title: "Tutorials",
    body: "Follow clear steps for creating, improving, verifying, and promoting a business profile.",
    icon: BookOpen
  },
  {
    href: "/support/knowledge-base",
    title: "Knowledge Base",
    body: "Find quick answers about listings, plans, verification, reviews, payments, and accounts.",
    icon: CircleHelp
  },
  {
    href: "/contact",
    title: "Contact Us",
    body: "Reach the Tradia team for account, billing, verification, partnership, or technical support.",
    icon: Mail
  },
  {
    href: "/support/report-abuse",
    title: "Report Abuse",
    body: "Report misleading listings, harmful reviews, impersonation, fraud, or other safety concerns.",
    icon: ShieldAlert
  }
];

export default function SupportPage() {
  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
          <p className="mb-2 text-sm font-extrabold uppercase text-ember">Tradia Support</p>
          <h1 className="max-w-4xl break-words text-3xl font-black leading-tight text-ink sm:text-4xl md:text-6xl">
            Help for finding, listing, and growing trusted businesses.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
            Start with a guide, find a quick answer, contact our team, or report a safety concern.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {supportOptions.map(({ href, title, body, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-52 flex-col rounded-tradia border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-forest hover:shadow-lg"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-forest">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-black text-ink">{title}</h2>
              <p className="mt-2 max-w-xl leading-7 text-slate-600">{body}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-forest">
                Open {title}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
