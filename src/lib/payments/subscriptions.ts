import { addYears } from "@/lib/time";
import { prisma } from "@/lib/db";

type ActivateSubscriptionInput = {
  reference: string;
  amount: number;
  currency?: string;
  paidAt?: Date;
  rawPayload?: unknown;
};

export async function activateSubscriptionFromPayment(input: ActivateSubscriptionInput) {
  const payment = await prisma.payment.findUnique({
    where: { providerReference: input.reference },
    include: {
      business: true
    }
  });

  if (!payment?.businessId) {
    throw new Error("Payment reference was not found for a business subscription.");
  }

  if (payment.status === "SUCCESS" && payment.subscriptionId) {
    return payment;
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: payment.businessId } });
  const paymentMetadata = payment.rawPayload as { planId?: string } | null;
  const planId = paymentMetadata?.planId ?? business.planId;

  if (!planId) {
    throw new Error("Payment does not include a plan id.");
  }

  await prisma.plan.findUniqueOrThrow({ where: { id: planId } });

  const startsAt = input.paidAt ?? new Date();
  const subscription = await prisma.subscription.create({
    data: {
      businessId: payment.businessId,
      planId,
      status: "ACTIVE",
      startsAt,
      endsAt: addYears(startsAt, 1),
      paymentProvider: payment.provider,
      providerReference: input.reference
    }
  });

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      subscriptionId: subscription.id,
      amount: input.amount,
      currency: input.currency ?? "NGN",
      status: "SUCCESS",
      paidAt: startsAt,
      rawPayload: input.rawPayload as object
    }
  });

  await prisma.business.update({
    where: { id: payment.businessId },
    data: { planId }
  });

  return updatedPayment;
}
