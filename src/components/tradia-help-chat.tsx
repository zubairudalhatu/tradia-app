"use client";

import Link from "next/link";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";

const guides = [
  { label: "List a business", keywords: ["list", "add business", "register business"], answer: "Create a free Tradia listing, add your business details, then submit it for review.", href: "/businesses/new", action: "List your business" },
  { label: "Claim a business", keywords: ["claim", "owner"], answer: "Open the existing business profile and use the claim option to request ownership.", href: "/businesses", action: "Find the business" },
  { label: "Get verified", keywords: ["verify", "verified", "verification"], answer: "Verification requests are available from your business dashboard after your profile is complete.", href: "/dashboard", action: "Open dashboard" },
  { label: "Plans and upgrades", keywords: ["plan", "upgrade", "pricing"], answer: "Compare Tradia plans and choose the visibility and media benefits that fit your business.", href: "/pricing", action: "View pricing" },
  { label: "Wallet or payment", keywords: ["wallet", "payment", "receipt", "money"], answer: "Your account page contains wallet funding, add-on orders, payments, and receipts.", href: "/account", action: "Open account" },
  { label: "Report abuse", keywords: ["abuse", "report", "scam"], answer: "Use the report-abuse page to flag a listing or activity for review.", href: "/support/report-abuse", action: "Report abuse" }
];

export function TradiaHelpChat() {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("Choose an activity below, or type a short question.");
  const [link, setLink] = useState<{ href: string; action: string } | null>(null);

  function choose(guide: typeof guides[number]) {
    setAnswer(guide.answer);
    setLink({ href: guide.href, action: guide.action });
  }

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const question = String(data.get("question") ?? "").toLowerCase();
    const guide = guides.find((item) => item.keywords.some((keyword) => question.includes(keyword)));
    if (guide) choose(guide);
    else {
      setAnswer("I could not match that request yet. Send it to the Tradia support centre and the team will help.");
      setLink({ href: "/contact#support-form", action: "Contact support" });
    }
    event.currentTarget.reset();
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <section className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-tradia border border-slate-200 bg-white shadow-2xl" aria-label="Tradia Help Assistant">
          <header className="flex items-center justify-between bg-ink px-4 py-3 text-white"><span className="flex items-center gap-2 font-black"><Bot className="h-5 w-5" />Tradia Help Assistant</span><button onClick={() => setOpen(false)} aria-label="Close help"><X className="h-5 w-5" /></button></header>
          <div className="max-h-[65vh] overflow-y-auto p-4">
            <p className="rounded-tradia bg-slate-50 p-3 text-sm leading-6 text-slate-700">{answer}</p>
            {link ? <Link href={link.href} className="mt-3 block rounded-tradia bg-forest px-4 py-3 text-center text-sm font-black text-white">{link.action}</Link> : null}
            <div className="mt-4 flex flex-wrap gap-2">{guides.map((guide) => <button key={guide.label} onClick={() => choose(guide)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-ink hover:border-forest hover:text-forest">{guide.label}</button>)}</div>
            <form onSubmit={ask} className="mt-4 grid grid-cols-[1fr_auto] gap-2"><input className="min-w-0 rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="question" placeholder="Type a short question" required /><button aria-label="Ask Tradia Help Assistant" className="rounded-tradia bg-forest px-3 text-white"><Send className="h-4 w-4" /></button></form>
          </div>
        </section>
      ) : null}
      <button onClick={() => setOpen(!open)} className="ml-auto flex items-center gap-2 rounded-full bg-forest px-5 py-3 font-black text-white shadow-xl" aria-expanded={open}><MessageCircle className="h-5 w-5" />Help</button>
    </div>
  );
}
