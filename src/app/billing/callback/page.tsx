import Link from "next/link";
import { activateSubscriptionFromPayment } from "@/lib/payments/subscriptions";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

type BillingCallbackPageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

export const dynamic = "force-dynamic";

export default async function BillingCallbackPage({ searchParams }: BillingCallbackPageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  let status: "success" | "pending" | "failed" = "pending";
  let message = "We could not find a Paystack reference on this callback.";

  if (reference) {
    try {
      const verification = await verifyPaystackTransaction(reference);
      const data = verification.data;

      if (verification.status && data?.status === "success") {
        await activateSubscriptionFromPayment({
          reference: data.reference,
          amount: Math.round(data.amount / 100),
          currency: data.currency,
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
          rawPayload: data
        });
        status = "success";
        message = "Payment confirmed. Your Tradia plan is active.";
      } else {
        status = "failed";
        message = verification.message || "Paystack did not confirm this payment.";
      }
    } catch {
      status = "failed";
      message = "We could not verify this payment yet. If you were debited, the webhook may still update your account.";
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Billing</p>
      <h1 className="text-4xl font-black tracking-normal">
        {status === "success" ? "Payment Successful" : "Payment Status"}
      </h1>
      <p className="mt-4 text-lg text-slate-600">{message}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">
          Go to Dashboard
        </Link>
        <Link href="/pricing" className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink">
          View Plans
        </Link>
      </div>
    </main>
  );
}
