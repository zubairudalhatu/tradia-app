import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];

export async function requireApiAdmin() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Admin permission required." }, { status: 403 })
    };
  }

  return { user, response: null };
}

export function normalizeAction(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
