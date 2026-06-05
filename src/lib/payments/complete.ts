import { prisma } from "@/lib/db";
import { activateSubscriptionFromPayment } from "@/lib/payments/subscriptions";
import { creditWalletTopUpFromPayment } from "@/lib/wallet/ledger";

type CompletePaymentInput = {
  reference: string;
  amount: number;
  currency?: string;
  paidAt?: Date;
  rawPayload?: unknown;
};

export async function completePaymentFromProvider(input: CompletePaymentInput) {
  const payment = await prisma.payment.findUnique({
    where: { providerReference: input.reference },
    select: { rawPayload: true }
  });
  const metadata = payment?.rawPayload as { kind?: string } | null;

  if (metadata?.kind === "wallet_top_up") {
    return creditWalletTopUpFromPayment(input);
  }

  return activateSubscriptionFromPayment(input);
}
