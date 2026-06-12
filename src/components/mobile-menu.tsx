"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type MobileMenuProps = {
  isSignedIn: boolean;
  canAccessAdmin: boolean;
};

const menuLinkClass = "rounded-tradia px-3 py-2 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none";

export function MobileMenu({ isSignedIn, canAccessAdmin }: MobileMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        className="rounded-tradia border border-slate-200 px-3 py-2 text-sm font-bold text-ink shadow-sm transition hover:border-forest/30 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        aria-expanded={isOpen}
        aria-controls="mobile-site-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        Menu
      </button>
      {isOpen ? (
        <nav
          id="mobile-site-menu"
          className="absolute right-0 top-12 z-50 grid w-48 gap-1 rounded-tradia border border-slate-200 bg-white p-2 text-sm font-bold text-slate-700 shadow-xl"
        >
          <Link className={menuLinkClass} href="/businesses" onClick={closeMenu}>Browse</Link>
          <Link className={menuLinkClass} href="/pricing" onClick={closeMenu}>Pricing</Link>
          <Link className={menuLinkClass} href="/dashboard" onClick={closeMenu}>Business</Link>
          {isSignedIn ? <Link className={menuLinkClass} href="/account" onClick={closeMenu}>Account</Link> : null}
          {canAccessAdmin ? <Link className={menuLinkClass} href="/admin" onClick={closeMenu}>Admin</Link> : null}
          <Link className="rounded-tradia px-3 py-2 text-forest transition hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none" href="/businesses/new" onClick={closeMenu}>
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
