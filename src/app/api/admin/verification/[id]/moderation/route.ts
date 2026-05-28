import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { requireApiAdmin, normalizeAction } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { notifyVerificationDecision } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { user: admin, response } = await requireApiAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = normalizeAction(body.action);

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Action must be approve or reject." }, { status: 422 });
  }

  const requestRecord = await prisma.verificationRequest.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: admin.id,
      reviewedAt: new Date()
    }
  });

  const business = await prisma.business.update({
    where: { id: requestRecord.businessId },
    data: { verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED" },
    include: { owner: true }
  });

  const submitter = await prisma.user.findUnique({ where: { id: requestRecord.submittedBy } });
  if (submitter) {
    await notifyVerificationDecision(business, submitter, action === "approve" ? "approved" : "rejected");
  }

  await createAuditLog({
    actorId: admin.id,
    action: action === "approve" ? "APPROVED_VERIFICATION" : "REJECTED_VERIFICATION",
    entityType: "VerificationRequest",
    entityId: requestRecord.id,
    metadata: { businessId: business.id, businessName: business.name, source: "api" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${business.slug}`);

  return NextResponse.json({ data: requestRecord });
}
