import Link from "next/link";
import type { ReactNode } from "react";

type TrustPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function TrustPage({ eyebrow, title, intro, children }: TrustPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">{eyebrow}</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl md:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
      <section className="mt-8 grid gap-5 rounded-tradia border border-slate-200 bg-white p-6 leading-7 text-slate-700 shadow-sm">
        {children}
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
