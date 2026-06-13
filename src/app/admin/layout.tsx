import type { ReactNode } from "react";
import { AdminSecondaryNav } from "@/components/admin-secondary-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminSecondaryNav />
      {children}
    </>
  );
}
