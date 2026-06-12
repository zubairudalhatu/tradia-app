"use server";

import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { initializePaystackPayment } from "@/lib/payments/paystack";
import { initializeSquadPayment } from "@/lib/payments/squad";
import { getWalletBalance, spendWalletProduct } from "@/lib/wallet/ledger";

export async function updateAccountAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/account");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = optionalString(formData.get("phone"));

  if (name.length < 2) {
    redirect("/account?error=invalid");
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone
      }
    });
  } catch {
    redirect("/account?error=phone");
  }

  redirect("/account?saved=1");
}

export async function startWalletTopUpAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/account");
  }

  const amount = normalizeTopUpAmount(formData.get("amount"));
  const paymentProvider = normalizePaymentProvider(String(formData.get("paymentProvider") ?? "squad"));

  if (amount < 1000 || amount > 500000) {
    redirect("/account?wallet=topup-invalid");
  }

  try {
    await getWalletBalance(user.id);
  } catch {
    redirect("/account?wallet=setup-required");
  }

  const reference = buildWalletPaymentReference(paymentProvider, user.id);
  const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing/callback`;
  const metadata = {
    kind: "wallet_top_up",
    userId: user.id
  };

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      provider: paymentProvider,
      providerReference: reference,
      amount,
      currency: "NGN",
      status: "PENDING",
      rawPayload: metadata
    }
  });

  await createAuditLog({
    actorId: user.id,
    action: "WALLET_TOP_UP_STARTED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      reference,
      amount,
      paymentProvider
    }
  });
  let authorizationUrl: string | undefined;

  try {
    authorizationUrl =
      paymentProvider === "squad"
        ? (await initializeSquadPayment({
            email: user.email,
            customerName: user.name,
            amountKobo: amount * 100,
            reference,
            callbackUrl,
            metadata
          }))?.data?.checkout_url
        : (await initializePaystackPayment({
            email: user.email,
            amountKobo: amount * 100,
            reference,
            callbackUrl,
            metadata
          }))?.data?.authorization_url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown wallet top-up error";
    console.error("Wallet top-up initialization failed", {
      provider: paymentProvider,
      message
    });

    if (message.includes("not configured")) {
      redirect(`/account?wallet=${paymentProvider}-not-configured`);
    }

    redirect(`/account?wallet=${paymentProvider}-provider-error`);
  }

  if (!authorizationUrl) {
    redirect("/account?wallet=topup-failed");
  }

  redirect(authorizationUrl);
}

export async function spendWalletProductAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/account");
  }

  const businessId = String(formData.get("businessId") ?? "");
  const productCode = String(formData.get("productCode") ?? "");

  try {
    await spendWalletProduct({
      userId: user.id,
      businessId,
      productCode
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("balance")) redirect("/account?wallet=low-balance");
    if (message.includes("WalletTransaction") || message.includes("does not exist")) redirect("/account?wallet=setup-required");
    if (message.includes("verified")) redirect("/account?wallet=requires-verified");
    if (message.includes("featured")) redirect("/account?wallet=already-featured");
    if (message.includes("Gold") || message.includes("Platinum")) redirect("/account?wallet=requires-feature-plan");

    redirect("/account?wallet=spend-invalid");
  }

  redirect("/account?wallet=spent");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function normalizeTopUpAmount(value: FormDataEntryValue | null) {
  return Math.round(Number(String(value ?? "").replace(/[^0-9.]/g, "")) || 0);
}

function normalizePaymentProvider(value: string) {
  return value === "paystack" ? "paystack" : "squad";
}

function buildWalletPaymentReference(provider: string, userId: string) {
  const rawReference = `tradia${provider}wallet${Date.now()}${userId.slice(0, 8)}`;
  return rawReference.replace(/[^a-zA-Z0-9]/g, "");
}
