import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json(
    {
      user: user && user.status === "ACTIVE"
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            canAccessAdmin: ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)
          }
        : null
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
