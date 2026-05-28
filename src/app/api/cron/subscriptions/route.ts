import { NextRequest, NextResponse } from "next/server";
import { runSubscriptionMaintenance } from "@/lib/subscriptions/maintenance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSubscriptionMaintenance();
  return NextResponse.json({ ok: true, ...result });
}

function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  return authorization === `Bearer ${secret}` || headerSecret === secret;
}
