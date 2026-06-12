import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CircleHelp, Mail, ShieldAlert } from "lucide-react";

const supportLinks = [
  { href: "/support/tutorials", label: "Tutorials", icon: BookOpen },
  { href: "/support/knowledge-base", label: "Knowledge Base", icon: CircleHelp },
  { href: "/contact", label: "Contact Us", icon: Mail },
  { href: "/support/report-abuse", label: "Report Abuse", icon: ShieldAlert }
];

export function SupportShell({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <Link href="/support" className="text-sm font-black text-forest hover:text-ink">
        Tradia Support
      </Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-extrabold uppercase text-ember">{eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-ink md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>
          <div className="mt-8">{children}</div>
        </div>
        <aside className="h-fit rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-ember">Support</p>
          <h2 className="mt-1 text-xl font-black text-ink">How can we help?</h2>
          <nav className="mt-4 grid gap-2" aria-label="Support navigation">
            {supportLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-tradia bg-slate-50 px-3 py-3 text-sm font-black text-ink transition hover:bg-emerald-50 hover:text-forest"
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </main>
  );
}
