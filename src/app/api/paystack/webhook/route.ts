import { NextResponse } from "next/server";
import { activateSubscriptionFromPayment } from "@/lib/payments/subscriptions";
import { verifyPaystackSignature } from "@/lib/payments/paystack";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload) as {
    event?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      paid_at?: string;
    };
  };

  if (event.event === "charge.success" && event.data?.status === "success" && event.data.reference) {
    await activateSubscriptionFromPayment({
      reference: event.data.reference,
      amount: Math.round((event.data.amount ?? 0) / 100),
      currency: event.data.currency,
      paidAt: event.data.paid_at ? new Date(event.data.paid_at) : new Date(),
      rawPayload: event
    });
  }

  return NextResponse.json({ received: true });
}
