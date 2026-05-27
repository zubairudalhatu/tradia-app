"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { initializePaystackPayment } from "@/lib/payments/paystack";
import { initializeSquadPayment } from "@/lib/payments/squad";

export async function startPlanCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const paymentProvider = normalizePaymentProvider(String(formData.get("paymentProvider") ?? "paystack"));

  const [plan, business] = await Promise.all([
    prisma.plan.findFirst({
      where: {
        id: planId,
        isActive: true
      }
    }),
    prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id
      }
    })
  ]);

  if (!plan || !business) {
    redirect("/pricing?checkout=invalid");
  }

  if (plan.annualPrice <= 0) {
    await prisma.business.update({
      where: { id: business.id },
      data: { planId: plan.id }
    });
    redirect("/dashboard?plan=free");
  }

  const reference = `tradia_${paymentProvider}_${Date.now()}_${business.id.slice(0, 8)}_${plan.id.slice(0, 8)}`;
  const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing/callback`;

  await prisma.payment.create({
    data: {
      userId: user.id,
      businessId: business.id,
      provider: paymentProvider,
      providerReference: reference,
      amount: plan.annualPrice,
      currency: "NGN",
      status: "PENDING",
      rawPayload: {
        planId: plan.id,
        businessId: business.id,
        userId: user.id,
        kind: "subscription"
      }
    }
  });

  const metadata = {
    planId: plan.id,
    businessId: business.id,
    userId: user.id,
    kind: "subscription"
  };
  let authorizationUrl: string | undefined;

  try {
    authorizationUrl =
      paymentProvider === "squad"
        ? (await initializeSquadPayment({
            email: user.email,
            customerName: user.name,
            amountKobo: plan.annualPrice * 100,
            reference,
            callbackUrl,
            metadata
          }))?.data?.checkout_url
        : (await initializePaystackPayment({
            email: user.email,
            amountKobo: plan.annualPrice * 100,
            reference,
            callbackUrl,
            metadata
          }))?.data?.authorization_url;
  } catch {
    redirect(`/pricing?checkout=${paymentProvider}-not-configured`);
  }

  if (!authorizationUrl) {
    redirect("/pricing?checkout=failed");
  }

  redirect(authorizationUrl);
}

function normalizePaymentProvider(value: string) {
  return value === "squad" ? "squad" : "paystack";
}
