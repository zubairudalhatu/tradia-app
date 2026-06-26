"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsLink, trackTradiaEvent } from "@/components/analytics-events";

type MobileMenuProps = {
  isSignedIn: boolean;
  canAccessAdmin: boolean;
};

const menuLinkClass = "rounded-tradia px-4 py-3 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none";

export function MobileMenu({ isSignedIn, canAccessAdmin }: MobileMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative z-[60] md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-tradia border border-slate-200 bg-white text-ink shadow-sm transition hover:border-forest/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        aria-expanded={isOpen}
        aria-controls="mobile-site-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
      </button>
      {isOpen ? (
        <nav
          id="mobile-site-menu"
          className="fixed left-3 right-3 top-[4.25rem] z-[60] grid max-h-[calc(100dvh-5rem)] gap-1 overflow-y-auto rounded-tradia border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 shadow-xl sm:left-4 sm:right-4 sm:top-20"
        >
          <Link className={menuLinkClass} href="/businesses" onClick={closeMenu}>Browse</Link>
          <Link className={menuLinkClass} href="/pricing" onClick={closeMenu}>Pricing</Link>
          <Link className={menuLinkClass} href="/dashboard" onClick={closeMenu}>Business</Link>
          <Link className={menuLinkClass} href="/support" onClick={closeMenu}>Support</Link>
          {isSignedIn ? (
            <AnalyticsLink
              className={menuLinkClass}
              href="/account"
              eventName="account_open"
              eventProperties={{ surface: "mobile_menu" }}
              onClick={closeMenu}
            >
              Account
            </AnalyticsLink>
          ) : null}
          {canAccessAdmin ? <Link className={menuLinkClass} href="/admin" onClick={closeMenu}>Admin</Link> : null}
          <Link
            className="rounded-tradia bg-forest px-4 py-3 text-center text-white transition hover:bg-forest/90 focus-visible:outline-none"
            href="/businesses/new"
            onClick={() => {
              trackTradiaEvent("add_business_tap", { surface: "mobile_menu" });
              closeMenu();
            }}
          >
            List Your Business Free
          </Link>
          {isSignedIn ? (
            <a className={menuLinkClass} href="/logout" onClick={closeMenu}>Logout</a>
          ) : (
            <Link className={menuLinkClass} href="/login" onClick={closeMenu}>Login</Link>
          )}
        </nav>
      ) : null}
    </div>
  );
}
