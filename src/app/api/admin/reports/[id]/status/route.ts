import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { requireApiAdmin, normalizeAction } from "@/lib/admin/api";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { user: admin, response } = await requireApiAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = normalizeAction(body.action);

  if (!["resolve", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "Action must be resolve or dismiss." }, { status: 422 });
  }

  const report = await prisma.report.update({
    where: { id },
    data: {
      status: action === "resolve" ? "RESOLVED" : "DISMISSED",
      resolvedBy: admin.id,
      resolvedAt: new Date()
    }
  });

  await createAuditLog({
    actorId: admin.id,
    action: action === "resolve" ? "RESOLVED_REPORT" : "DISMISSED_REPORT",
    entityType: "Report",
    entityId: report.id,
    metadata: { source: "api" }
  });

  revalidatePath("/admin");

  return NextResponse.json({ data: report });
}
