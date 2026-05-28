"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function updateLeadStatusAction(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const status = normalizeLeadStatus(String(formData.get("status") ?? "NEW"));

  const lead = await prisma.contactLead.findFirst({
    where: {
      id: leadId,
      business: {
        ownerId: user.id
      }
    },
    include: {
      business: true
    }
  });

  if (!lead) {
    redirect("/dashboard?lead=not-found");
  }

  await prisma.contactLead.update({
    where: { id: lead.id },
    data: { status }
  });

  await createAuditLog({
    actorId: user.id,
    action: `MARKED_LEAD_${status}`,
    entityType: "ContactLead",
    entityId: lead.id,
    metadata: { businessId: lead.businessId, businessName: lead.business.name }
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?lead=updated");
}

function normalizeLeadStatus(value: string) {
  if (["NEW", "CONTACTED", "CLOSED", "SPAM"].includes(value)) {
    return value as "NEW" | "CONTACTED" | "CLOSED" | "SPAM";
  }

  return "NEW";
}
