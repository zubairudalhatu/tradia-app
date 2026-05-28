import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { requireApiAdmin, normalizeAction } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { refreshBusinessRating } from "@/lib/ratings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { user: admin, response } = await requireApiAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = normalizeAction(body.action);

  if (!["publish", "reject", "remove"].includes(action)) {
    return NextResponse.json({ error: "Action must be publish, reject, or remove." }, { status: 422 });
  }

  const review = await prisma.review.update({
    where: { id },
    data: { status: reviewStatusForAction(action) },
    include: { business: true }
  });

  await refreshBusinessRating(review.businessId);
  await createAuditLog({
    actorId: admin.id,
    action: `${reviewStatusForAction(action)}_REVIEW`,
    entityType: "Review",
    entityId: review.id,
    metadata: { businessId: review.businessId, source: "api" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${review.business.slug}`);

  return NextResponse.json({ data: review });
}

function reviewStatusForAction(action: string) {
  if (action === "publish") return "PUBLISHED";
  if (action === "remove") return "REMOVED";
  return "REJECTED";
}
