"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnalyticsLink } from "@/components/analytics-events";
import { MobileMenu } from "@/components/mobile-menu";

type SessionState = {
  user: {
    id: string;
    name: string | null;
    role: string;
    canAccessAdmin: boolean;
  } | null;
};

const navLinkClass =
  "rounded-tradia px-3 py-2 transition hover:bg-white hover:text-forest hover:shadow-md focus-visible:bg-white focus-visible:text-forest focus-visible:shadow-md focus-visible:outline-none";

export function SiteNavigation() {
  const [session, setSession] = useState<SessionState>({ user: null });

  useEffect(() => {
    let isMounted = true;

    fetch("/api/session", {
      cache: "no-store",
      credentials: "same-origin"
    })
      .then((response) => response.json() as Promise<SessionState>)
      .then((data) => {
        if (isMounted) setSession(data);
      })
      .catch(() => {
        if (isMounted) setSession({ user: null });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isSignedIn = Boolean(session.user);
  const canAccessAdmin = Boolean(session.user?.canAccessAdmin);

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">
        <Link className={navLinkClass} href="/businesses">Browse</Link>
        <Link className={navLinkClass} href="/pricing">Pricing</Link>
        <Link className={navLinkClass} href="/dashboard">Business</Link>
        {isSignedIn ? (
          <AnalyticsLink className={navLinkClass} href="/account" eventName="account_open" eventProperties={{ surface: "desktop_nav" }}>
            Account
          </AnalyticsLink>
        ) : null}
        {canAccessAdmin ? <Link className={navLinkClass} href="/admin">Admin</Link> : null}
        {isSignedIn ? <a className={navLinkClass} href="/logout">Logout</a> : <Link className={navLinkClass} href="/login">Login</Link>}
      </nav>
      <MobileMenu isSignedIn={isSignedIn} canAccessAdmin={canAccessAdmin} />
      <AnalyticsLink
        href="/businesses/new"
        eventName="add_business_tap"
        eventProperties={{ surface: "desktop_nav" }}
        className="hidden rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white sm:inline-flex"
      >
        List Your Business Free
      </AnalyticsLink>
    </>
  );
}
