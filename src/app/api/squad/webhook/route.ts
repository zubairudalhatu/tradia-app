import { NextResponse } from "next/server";
import { activateSubscriptionFromPayment } from "@/lib/payments/subscriptions";

type SquadWebhookPayload = {
  Event?: string;
  TransactionRef?: string;
  Body?: {
    amount?: number;
    transaction_ref?: string;
    transaction_status?: string;
    currency?: string;
    transaction_currency_id?: string;
    created_at?: string;
  };
};

export async function POST(request: Request) {
  const event = (await request.json()) as SquadWebhookPayload;
  const body = event.Body;
  const reference = body?.transaction_ref ?? event.TransactionRef;

  if (event.Event === "charge_successful" && body?.transaction_status === "Success" && reference) {
    await activateSubscriptionFromPayment({
      reference,
      amount: Math.round((body.amount ?? 0) / 100),
      currency: body.currency ?? body.transaction_currency_id,
      paidAt: body.created_at ? new Date(body.created_at) : new Date(),
      rawPayload: event
    });
  }

  return NextResponse.json({ received: true });
}
