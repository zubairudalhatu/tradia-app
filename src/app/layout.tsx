import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "Tradia - Nigeria's Trusted Business Directory",
  description: "Discover, verify, and connect with trusted Nigerian businesses, starting in Kano.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
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
              <Link href="/admin">Admin</Link>
              {user ? <Link href="/logout">Logout</Link> : <Link href="/login">Login</Link>}
            </nav>
            <Link
              href="/businesses/new"
              className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white"
            >
              Add Business
            </Link>
          </div>
        </header>
        {children}
        <footer className="border-t border-slate-200 bg-ink text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm md:flex-row md:items-center md:justify-between">
            <strong>© 2026 Zamkah Technologies Limited</strong>
            <div className="flex flex-wrap gap-4 text-white/80">
              <a href="mailto:tradia@zamkah.com.ng">tradia@zamkah.com.ng</a>
              <a href="https://wa.me/2349055091300">+234 905 509 1300</a>
              <span>@tradiasocial</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
