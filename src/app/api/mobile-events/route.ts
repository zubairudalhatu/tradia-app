import { NextResponse } from "next/server";
import { z } from "zod";

const mobileEventSchema = z.object({
  name: z.enum(["mobile_search_submitted", "mobile_add_business_tap", "mobile_account_open", "mobile_open_full_profile"]),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export async function POST(request: Request) {
  const payload = mobileEventSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid mobile analytics event." }, { status: 400 });
  }

  console.info("tradia_mobile_event", {
    name: payload.data.name,
    properties: payload.data.properties ?? {},
    receivedAt: new Date().toISOString()
  });

  return new NextResponse(null, { status: 204 });
}
