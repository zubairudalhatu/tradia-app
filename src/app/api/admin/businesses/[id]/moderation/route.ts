import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { requireApiAdmin, normalizeAction } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { notifyBusinessDecision } from "@/lib/notifications";

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

  const business = await prisma.business.update({
    where: { id },
    data: { listingStatus: action === "approve" ? "PUBLISHED" : "REJECTED" },
    include: { owner: true }
  });

  await notifyBusinessDecision(business, action === "approve" ? "approved" : "rejected");
  await createAuditLog({
    actorId: admin.id,
    action: action === "approve" ? "APPROVED_BUSINESS" : "REJECTED_BUSINESS",
    entityType: "Business",
    entityId: business.id,
    metadata: { businessName: business.name, source: "api" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${business.slug}`);

  return NextResponse.json({ data: business });
}
