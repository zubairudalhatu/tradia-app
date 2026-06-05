import { addDays } from "@/lib/time";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { getWalletProduct } from "@/lib/wallet/products";

type ConfirmWalletTopUpInput = {
  reference: string;
  amount: number;
  currency?: string;
  paidAt?: Date;
  rawPayload?: unknown;
};

export async function getWalletBalance(userId: string) {
  const [credits, debits] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { userId, type: "CREDIT" },
      _sum: { amount: true }
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "DEBIT" },
      _sum: { amount: true }
    })
  ]);

  return (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0);
}

export function listWalletTransactions(userId: string, take = 12) {
  return prisma.walletTransaction.findMany({
    where: { userId },
    include: { business: true },
    orderBy: { createdAt: "desc" },
    take
  });
}

export async function creditWalletTopUpFromPayment(input: ConfirmWalletTopUpInput) {
  const payment = await prisma.payment.findUnique({
    where: { providerReference: input.reference },
    include: { walletTransaction: true }
  });

  if (!payment) {
    throw new Error("Payment reference was not found for a wallet top-up.");
  }

  const metadata = (payment.rawPayload as { kind?: string } | null) ?? {};
  if (metadata.kind !== "wallet_top_up") {
    throw new Error("Payment is not a wallet top-up.");
  }

  if (payment.status === "SUCCESS" && payment.walletTransaction) {
    return payment.walletTransaction;
  }

  const paidAt = input.paidAt ?? new Date();
  const amount = input.amount || payment.amount;
  const currency = input.currency ?? payment.currency ?? "NGN";
  const rawPayload = input.rawPayload ? { providerPayload: input.rawPayload as object } : {};

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        amount,
        currency,
        status: "SUCCESS",
        paidAt,
        rawPayload: {
          ...metadata,
          ...rawPayload
        }
      }
    });

    return tx.walletTransaction.create({
      data: {
        userId: payment.userId,
        paymentId: updatedPayment.id,
        type: "CREDIT",
        amount,
        currency,
        description: "Wallet top-up",
        reference: `wallet-credit-${input.reference}`,
        metadata: {
          provider: payment.provider,
          paymentReference: input.reference
        }
      }
    });
  });
}

export async function spendWalletProduct(input: {
  userId: string;
  businessId: string;
  productCode: string;
}) {
  const product = getWalletProduct(input.productCode);
  if (!product) {
    throw new Error("Invalid wallet product.");
  }

  const business = await prisma.business.findFirst({
    where: {
      id: input.businessId,
      ownerId: input.userId
    },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      },
      featuredPlacements: {
        where: {
          status: "ACTIVE",
          placementType: "HOMEPAGE",
          endsAt: { gte: new Date() }
        }
      }
    }
  });

  if (!business || business.listingStatus !== "PUBLISHED") {
    throw new Error("Choose one of your published businesses.");
  }

  if (product.requiresVerified && business.verificationStatus !== "VERIFIED") {
    throw new Error("This kit is available only for verified businesses.");
  }

  if (product.code === "homepage_feature_30" && business.featuredPlacements.length) {
    throw new Error("This business is already featured.");
  }

  if (product.code === "homepage_feature_30" && !getBusinessPlanState(business).benefits.canBeFeatured) {
    throw new Error("This business needs Gold or Platinum feature eligibility.");
  }

  return prisma.$transaction(async (tx) => {
    const [credits, debits] = await Promise.all([
      tx.walletTransaction.aggregate({
        where: { userId: input.userId, type: "CREDIT" },
        _sum: { amount: true }
      }),
      tx.walletTransaction.aggregate({
        where: { userId: input.userId, type: "DEBIT" },
        _sum: { amount: true }
      })
    ]);
    const balance = (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0);

    if (balance < product.price) {
      throw new Error("Wallet balance is too low.");
    }

    const reference = `wallet-spend-${Date.now()}-${input.userId.slice(0, 8)}-${input.businessId.slice(0, 8)}`;
    const transaction = await tx.walletTransaction.create({
      data: {
        userId: input.userId,
        businessId: input.businessId,
        type: "DEBIT",
        amount: product.price,
        description: product.name,
        reference,
        metadata: {
          productCode: product.code,
          productName: product.name
        }
      }
    });

    if (product.code === "homepage_feature_30") {
      const now = new Date();
      await tx.featuredPlacement.create({
        data: {
          businessId: input.businessId,
          placementType: "HOMEPAGE",
          startsAt: now,
          endsAt: addDays(now, product.durationDays ?? 30),
          status: "ACTIVE"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.userId,
        action: "WALLET_PRODUCT_PURCHASED",
        entityType: "Business",
        entityId: input.businessId,
        metadata: {
          productCode: product.code,
          productName: product.name,
          amount: product.price,
          walletTransactionId: transaction.id
        }
      }
    });

    return transaction;
  });
}
