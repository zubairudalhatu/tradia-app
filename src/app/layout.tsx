import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNavigation } from "@/components/site-navigation";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com"),
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
  openGraph: {
    title: "Tradia | Nigeria Business Directory for Verified Local Businesses",
    description: "Discover verified businesses across Nigeria, compare reviews and contact details, and list your Nigerian business for better visibility.",
    url: "/",
    siteName: "Tradia",
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Tradia | Nigeria Business Directory for Verified Local Businesses",
    description: "Discover verified businesses across Nigeria, compare reviews and contact details, and list your Nigerian business for better visibility."
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION
      }
    : undefined
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com").replace(/\/$/, "");
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Tradia",
    url: baseUrl,
    logo: `${baseUrl}/brand/tradia-logo.png`,
    legalName: "Zamkah Technologies Limited",
    sameAs: [
      "https://www.tradiabusiness.com",
      "https://x.com/tradiabusiness",
      "https://www.instagram.com/tradiabusiness",
      "https://www.facebook.com/tradiabusiness",
      "https://www.tiktok.com/@tradiabusiness",
      "https://www.youtube.com/@tradiabusiness"
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
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-5 sm:py-4">
            <Link href="/" className="block w-32 shrink-0 sm:w-40" aria-label="Tradia home">
              <Image src="/brand/tradia-logo.png" alt="Tradia" width={320} height={93} priority />
            </Link>
            <SiteNavigation />
          </div>
        </header>
        {children}
        <footer className="border-t border-slate-200 bg-ink text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <strong>&copy; 2026 Zamkah Technologies Limited</strong>
              <p className="mt-3 max-w-sm leading-6 text-white/65">
                Helping customers discover trusted businesses and helping Nigerian SMEs build credible digital profiles.
              </p>
            </div>
            <FooterLinks title="Discover">
              <Link href="/businesses">Browse businesses</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/businesses/new">List your business</Link>
            </FooterLinks>
            <FooterLinks title="Support">
              <Link href="/support/tutorials">Tutorials</Link>
              <Link href="/support/knowledge-base">Knowledge Base</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/support/report-abuse">Report Abuse</Link>
            </FooterLinks>
            <FooterLinks title="Company & policies">
              <Link href="/about">About</Link>
              <Link href="/verification-policy">Verification</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refund-policy">Refunds</Link>
            </FooterLinks>
          </div>
        </footer>
      </body>
    </html>
  );
}

function FooterLinks({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav className="grid content-start gap-3 text-white/75">
      <p className="font-black text-white">{title}</p>
      {children}
    </nav>
  );
}
