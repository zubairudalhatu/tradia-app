"use client";

import Link from "next/link";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const guides = [
  { label: "List a business", answer: "Create a free Tradia listing, add your business details, then submit it for review.", href: "/businesses/new", action: "List your business" },
  { label: "Claim a business", answer: "Open the existing business profile and use the claim option to request ownership.", href: "/businesses", action: "Find the business" },
  { label: "Get verified", answer: "Verification requests are available from your business dashboard after your profile is complete.", href: "/dashboard", action: "Open dashboard" },
  { label: "Plans and upgrades", answer: "Compare Tradia plans and choose the visibility and media benefits that fit your business.", href: "/pricing", action: "View pricing" },
  { label: "Wallet or payment", answer: "Your account page contains wallet funding, add-on orders, payments, and receipts.", href: "/account", action: "Open account" },
  { label: "Report abuse", answer: "Use the report-abuse page to flag a listing or activity for review.", href: "/support/report-abuse", action: "Report abuse" }
];

export function TradiaHelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello. Ask me a question about using Tradia, or choose an activity below." }
  ]);
  const [link, setLink] = useState<{ href: string; action: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function choose(guide: typeof guides[number]) {
    setMessages((current) => [...current, { role: "assistant", content: guide.answer }]);
    setLink({ href: guide.href, action: guide.action });
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const question = String(data.get("question") ?? "").trim();
    if (!question) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setLink(null);
    setLoading(true);
    form.reset();

    try {
      const response = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });
      const result = await response.json() as { answer?: string; error?: string };
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.answer || result.error || "Live chat is temporarily unavailable. Please contact Tradia Support."
      }]);
      if (!response.ok) setLink({ href: "/contact#support-form", action: "Contact support" });
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Live chat is temporarily unavailable. Please contact Tradia Support." }]);
      setLink({ href: "/contact#support-form", action: "Contact support" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-50 sm:right-4">
      {open ? (
        <section className="fixed inset-x-3 bottom-20 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-tradia border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-3 sm:max-h-[min(680px,calc(100dvh-6rem))] sm:w-[390px]" aria-label="Tradia Help Assistant">
          <header className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <span className="flex items-center gap-2 font-black"><Bot className="h-5 w-5" />Tradia Help Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close help"><X className="h-5 w-5" /></button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="grid gap-3">
              {messages.map((message, index) => (
                <p key={`${message.role}-${index}`} className={`max-w-[90%] rounded-tradia p-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-forest text-white" : "bg-slate-50 text-slate-700"}`}>
                  {message.content}
                </p>
              ))}
              {loading ? <p className="flex items-center gap-2 rounded-tradia bg-slate-50 p-3 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Thinking...</p> : null}
            </div>
            {link ? <Link href={link.href} className="mt-3 block rounded-tradia bg-forest px-4 py-3 text-center text-sm font-black text-white">{link.action}</Link> : null}
            <div className="mt-4 flex flex-wrap gap-2">{guides.map((guide) => <button key={guide.label} onClick={() => choose(guide)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-ink hover:border-forest hover:text-forest">{guide.label}</button>)}</div>
            <form onSubmit={ask} className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <input className="min-w-0 rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="question" maxLength={700} placeholder="Ask a question about Tradia" required />
              <button disabled={loading} aria-label="Ask Tradia Help Assistant" className="rounded-tradia bg-forest px-3 text-white disabled:bg-slate-300"><Send className="h-4 w-4" /></button>
            </form>
            <p className="mt-3 text-xs leading-5 text-slate-500">AI-generated guidance may be imperfect. Do not share passwords, verification codes, or payment card details.</p>
          </div>
        </section>
      ) : null}
      <button onClick={() => setOpen(!open)} className="ml-auto flex items-center gap-2 rounded-full bg-forest px-5 py-3 font-black text-white shadow-xl" aria-expanded={open}><MessageCircle className="h-5 w-5" />Help</button>
    </div>
  );
}
