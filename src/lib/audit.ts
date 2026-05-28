import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditLogInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog({ actorId, action, entityType, entityId, metadata }: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata
      }
    });
  } catch (error) {
    console.error("Failed to create audit log", error);
  }
}
