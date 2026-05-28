import { prisma } from "@/lib/db";
import {
  notifySubscriptionExpired,
  notifySubscriptionRenewalDue
} from "@/lib/notifications";
import { addDays } from "@/lib/time";

const reminderDays = [30, 7, 1] as const;

export async function runSubscriptionMaintenance(now = new Date()) {
  const freePlan = await prisma.plan.findUnique({ where: { name: "Free" } });
  const reminderResults = await Promise.all(reminderDays.map((daysBefore) => sendRenewalReminders(daysBefore, now)));
  const expiredCount = await expireEndedSubscriptions(now, freePlan?.id);

  return {
    remindersSent: reminderResults.reduce((sum, count) => sum + count, 0),
    expiredCount
  };
}

async function sendRenewalReminders(daysBefore: (typeof reminderDays)[number], now: Date) {
  const action = `SUBSCRIPTION_RENEWAL_REMINDER_${daysBefore}`;
  const windowStart = daysBefore === 30 ? addDays(now, 7) : daysBefore === 7 ? addDays(now, 1) : now;
  const windowEnd = addDays(now, daysBefore);
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: { annualPrice: { gt: 0 } },
      endsAt: {
        gt: windowStart,
        lte: windowEnd
      }
    },
    include: {
      plan: true,
      business: {
        include: {
          owner: true
        }
      }
    },
    orderBy: { endsAt: "asc" },
    take: 100
  });
  let sent = 0;

  for (const subscription of subscriptions) {
    if (!subscription.business.owner?.email) continue;
    if (await hasAuditLog(action, subscription.id)) continue;

    await notifySubscriptionRenewalDue(
      subscription.business,
      subscription.business.owner,
      subscription.plan.name,
      subscription.endsAt,
      daysBefore
    );
    await createSubscriptionAudit(action, subscription.id, {
      businessId: subscription.businessId,
      planId: subscription.planId,
      endsAt: subscription.endsAt
    });
    sent += 1;
  }

  return sent;
}

async function expireEndedSubscriptions(now: Date, freePlanId?: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: { annualPrice: { gt: 0 } },
      endsAt: { lte: now }
    },
    include: {
      plan: true,
      business: {
        include: {
          owner: true
        }
      }
    },
    orderBy: { endsAt: "asc" },
    take: 100
  });
  let expired = 0;

  for (const subscription of subscriptions) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" }
    });

    const activeReplacement = await prisma.subscription.findFirst({
      where: {
        businessId: subscription.businessId,
        status: "ACTIVE",
        endsAt: { gt: now },
        id: { not: subscription.id }
      }
    });

    if (!activeReplacement && freePlanId) {
      await prisma.business.update({
        where: { id: subscription.businessId },
        data: { planId: freePlanId }
      });
    }

    if (subscription.business.owner?.email && !(await hasAuditLog("SUBSCRIPTION_EXPIRED_NOTICE", subscription.id))) {
      await notifySubscriptionExpired(
        subscription.business,
        subscription.business.owner,
        subscription.plan.name,
        subscription.endsAt
      );
      await createSubscriptionAudit("SUBSCRIPTION_EXPIRED_NOTICE", subscription.id, {
        businessId: subscription.businessId,
        planId: subscription.planId,
        endsAt: subscription.endsAt
      });
    }

    expired += 1;
  }

  return expired;
}

async function hasAuditLog(action: string, entityId: string) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action,
      entityType: "Subscription",
      entityId
    },
    select: { id: true }
  });

  return Boolean(existing);
}

async function createSubscriptionAudit(action: string, entityId: string, metadata: object) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "Subscription",
      entityId,
      metadata
    }
  });
}
