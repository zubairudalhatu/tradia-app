import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileMenu } from "@/components/mobile-menu";
import { getCurrentUser } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Tradia | Nigeria Business Directory for Verified Local Businesses",
    template: "%s | Tradia"
  },
  description: "Discover verified businesses across Nigeria on Tradia. Find local services, view reviews, explore categories, and list your business for better visibility.",
  keywords: [
    "Nigeria business directory",
    "business directory in Nigeria",
    "verified businesses in Nigeria",
    "find businesses in Nigeria",
    "list your business in Nigeria",
    "local business directory Nigeria",
    "trusted business directory Nigeria",
    "online business listing Nigeria",
    "business discovery platform Nigeria",
    "SME business listing Nigeria"
  ],
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
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradia.business").replace(/\/$/, "");
  const canAccessAdmin = Boolean(user && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role));
  const navLinkClass =
    "rounded-tradia px-3 py-2 transition hover:bg-white hover:text-forest hover:shadow-md focus-visible:bg-white focus-visible:text-forest focus-visible:shadow-md focus-visible:outline-none";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Tradia",
    url: baseUrl,
    logo: `${baseUrl}/brand/tradia-logo.png`,
    legalName: "Zamkah Technologies Limited",
    sameAs: [
      "https://www.tradia.business"
    ]
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "Tradia",
    url: baseUrl,
    publisher: {
      "@id": `${baseUrl}/#organization`
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/businesses?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
            <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">
              <Link className={navLinkClass} href="/businesses">Browse</Link>
              <Link className={navLinkClass} href="/pricing">Pricing</Link>
              <Link className={navLinkClass} href="/dashboard">Business</Link>
              {user ? <Link className={navLinkClass} href="/account">Account</Link> : null}
              {canAccessAdmin ? <Link className={navLinkClass} href="/admin">Admin</Link> : null}
              {user ? <Link className={navLinkClass} href="/logout">Logout</Link> : <Link className={navLinkClass} href="/login">Login</Link>}
            </nav>
            <MobileMenu isSignedIn={Boolean(user)} canAccessAdmin={canAccessAdmin} />
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
