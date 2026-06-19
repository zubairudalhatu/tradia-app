import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, Headphones, Scale } from "lucide-react";

const policyLinks = [
  { href: "/about", label: "About Tradia" },
  { href: "/verification-policy", label: "Verification Policy" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/refund-policy", label: "Refund Policy" }
];

type TrustPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function TrustPage({ eyebrow, title, intro, children }: TrustPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
      <div className="max-w-4xl">
        <p className="mb-2 text-sm font-extrabold uppercase text-ember">{eyebrow}</p>
        <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
        <p className="mt-3 text-xs font-bold uppercase text-slate-400">Last reviewed: 19 June 2026</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 border-y border-slate-200 py-7 leading-7 text-slate-700 [&_a]:font-bold [&_a]:text-forest [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_li]:pl-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc">
          {children}
        </article>
        <aside className="h-fit border-l-4 border-forest bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase text-ember">Company & policies</p>
          <h2 className="mt-1 text-xl font-black text-ink">Trust centre</h2>
          <nav className="mt-4 grid gap-1" aria-label="Company and policy pages">
            {policyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-tradia px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white hover:text-forest">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      <section className="grid border-b border-slate-200 py-7 sm:grid-cols-3" aria-label="Tradia policy commitments">
        <Commitment icon={BadgeCheck} title="Clear standards" body="Published rules explain how listings, verification, and payments are handled." />
        <Commitment icon={Scale} title="Fair review" body="Moderation decisions consider submitted information and platform safety." />
        <Commitment icon={Headphones} title="Human support" body="Questions and disputes can be sent securely to the Tradia support centre." />
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-tradia bg-forest px-5 py-3 font-bold text-white" href="/businesses/new">
          List Your Business Free
        </Link>
        <Link className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink" href="/contact">
          Contact Tradia
        </Link>
      </div>
    </main>
  );
}

function Commitment({ icon: Icon, title, body }: { icon: typeof BadgeCheck; title: string; body: string }) {
  return (
    <div className="flex gap-3 border-slate-200 py-4 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
      <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-forest" />
      <div><h2 className="font-black text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{body}</p></div>
    </div>
  );
}
