import Link from "next/link";
import { prisma } from "@/lib/db";
import { completePaymentFromProvider } from "@/lib/payments/complete";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { verifySquadTransaction } from "@/lib/payments/squad";

type BillingCallbackPageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

export const dynamic = "force-dynamic";

export default async function BillingCallbackPage({ searchParams }: BillingCallbackPageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  let status: "success" | "pending" | "failed" = "pending";
  let message = "We could not find a payment reference on this callback.";

  if (reference) {
    try {
      const payment = await prisma.payment.findUnique({ where: { providerReference: reference } });

      if (payment?.provider === "squad") {
        const verification = await verifySquadTransaction(reference);
        const data = verification.data;

        if (verification.success && data?.transaction_status === "Success" && data.transaction_ref) {
          await completePaymentFromProvider({
            reference: data.transaction_ref,
            amount: Math.round((data.transaction_amount ?? payment.amount * 100) / 100),
            currency: data.transaction_currency_id,
            paidAt: data.created_at ? new Date(data.created_at) : new Date(),
            rawPayload: data
          });
          status = "success";
          message = payment.rawPayload && (payment.rawPayload as { kind?: string }).kind === "wallet_top_up"
            ? "Payment confirmed. Your Tradia wallet has been funded."
            : "Payment confirmed. Your Tradia plan is active.";
        } else {
          status = "failed";
          message = verification.message || "Squad did not confirm this payment.";
        }
      } else {
        const verification = await verifyPaystackTransaction(reference);
        const data = verification.data;

        if (verification.status && data?.status === "success") {
          await completePaymentFromProvider({
            reference: data.reference,
            amount: Math.round(data.amount / 100),
            currency: data.currency,
            paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
            rawPayload: data
          });
          status = "success";
          message = payment?.rawPayload && (payment.rawPayload as { kind?: string }).kind === "wallet_top_up"
            ? "Payment confirmed. Your Tradia wallet has been funded."
            : "Payment confirmed. Your Tradia plan is active.";
        } else {
          status = "failed";
          message = verification.message || "Paystack did not confirm this payment.";
        }
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
        <Link href="/account" className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">
          Go to Account
        </Link>
        <Link href="/pricing" className="rounded-tradia bg-slate-100 px-5 py-3 font-bold text-ink">
          View Plans
        </Link>
      </div>
    </main>
  );
}
