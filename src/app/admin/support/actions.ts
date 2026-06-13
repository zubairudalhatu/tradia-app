"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function updateSupportRequestAction(requestId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/support");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const status = String(formData.get("status") ?? "OPEN");
  if (!["OPEN", "IN_PROGRESS", "RESOLVED", "SPAM"].includes(status)) return;

  await prisma.supportRequest.update({
    where: { id: requestId },
    data: { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "SPAM" }
  });
  revalidatePath("/admin/support");
}
