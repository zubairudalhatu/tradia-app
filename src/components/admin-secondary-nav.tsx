import Link from "next/link";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/communications", label: "Communications" },
  { href: "/admin/support", label: "Support" }
];

export function AdminSecondaryNav() {
  return (
    <nav aria-label="Admin sections" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-tradia bg-slate-100 px-4 py-2 text-sm font-black text-ink transition hover:bg-emerald-50 hover:text-forest"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
