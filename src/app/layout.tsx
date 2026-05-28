import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Tradia - Nigeria's Trusted Business Directory",
  description: "Discover, verify, and connect with trusted Nigerian businesses across all 36 states and the FCT.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION
      }
    : undefined
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();
  const canAccessAdmin = Boolean(user && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role));

  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5482232753323076"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
            <Link href="/" className="block w-40" aria-label="Tradia home">
              <Image src="/brand/tradia-logo.png" alt="Tradia" width={320} height={93} priority />
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
              <Link href="/businesses">Browse</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/dashboard">Business</Link>
              {user ? <Link href="/account">Account</Link> : null}
              {canAccessAdmin ? <Link href="/admin">Admin</Link> : null}
              {user ? <Link href="/logout">Logout</Link> : <Link href="/login">Login</Link>}
            </nav>
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-tradia border border-slate-200 px-3 py-2 text-sm font-bold text-ink">
                Menu
              </summary>
              <nav className="absolute right-0 top-12 z-50 grid w-48 gap-1 rounded-tradia border border-slate-200 bg-white p-2 text-sm font-bold text-slate-700 shadow-xl">
                <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/businesses">Browse</Link>
                <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/pricing">Pricing</Link>
                <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/dashboard">Business</Link>
                {user ? <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/account">Account</Link> : null}
                {canAccessAdmin ? <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/admin">Admin</Link> : null}
                <Link className="rounded-tradia px-3 py-2 text-forest hover:bg-emerald-50" href="/businesses/new">Add Business</Link>
                {user ? (
                  <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/logout">Logout</Link>
                ) : (
                  <Link className="rounded-tradia px-3 py-2 hover:bg-slate-50" href="/login">Login</Link>
                )}
              </nav>
            </details>
            <Link
              href="/businesses/new"
              className="hidden rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white sm:inline-flex"
            >
              Add Business
            </Link>
          </div>
        </header>
        {children}
        <footer className="border-t border-slate-200 bg-ink text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-sm md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <strong>&copy; 2026 Zamkah Technologies Limited</strong>
            </div>
            <nav className="flex flex-wrap gap-4 text-white/80 md:justify-end">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/verification-policy">Verification</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refund-policy">Refunds</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
