"use server";

import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { initializePaystackPayment } from "@/lib/payments/paystack";
import { initializeSquadPayment } from "@/lib/payments/squad";

export async function startPlanCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const paymentProvider = normalizePaymentProvider(String(formData.get("paymentProvider") ?? "squad"));

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
      },
      include: {
        plan: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { endsAt: "desc" }
        }
      }
    })
  ]);

  if (!plan || !business) {
    redirect("/pricing?checkout=invalid");
  }

  const planState = getBusinessPlanState(business);

  if (planState.plan && planState.plan.annualPrice >= plan.annualPrice) {
    redirect("/pricing?checkout=current-plan");
  }

  if (plan.annualPrice <= 0) {
    await prisma.business.update({
      where: { id: business.id },
      data: { planId: plan.id }
    });
    redirect("/dashboard?plan=free");
  }

  const reference = buildPaymentReference(paymentProvider, business.id, plan.id);
  const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing/callback`;

  const payment = await prisma.payment.create({
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

  await createAuditLog({
    actorId: user.id,
    action: "PLAN_CHECKOUT_STARTED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      reference,
      businessId: business.id,
      businessName: business.name,
      planId: plan.id,
      planName: plan.name,
      amount: plan.annualPrice,
      paymentProvider
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown checkout error";
    console.error("Checkout initialization failed", {
      provider: paymentProvider,
      message
    });

    if (message.includes("not configured")) {
      redirect(`/pricing?checkout=${paymentProvider}-not-configured`);
    }

    redirect(`/pricing?checkout=${paymentProvider}-provider-error`);
  }

  if (!authorizationUrl) {
    redirect("/pricing?checkout=failed");
  }

  redirect(authorizationUrl);
}

function normalizePaymentProvider(value: string) {
  return value === "paystack" ? "paystack" : "squad";
}

function buildPaymentReference(provider: string, businessId: string, planId: string) {
  const rawReference = `tradia${provider}${Date.now()}${businessId.slice(0, 8)}${planId.slice(0, 8)}`;
  return rawReference.replace(/[^a-zA-Z0-9]/g, "");
}
