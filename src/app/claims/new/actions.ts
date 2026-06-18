"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyClaimSubmitted } from "@/lib/notifications";
import { claimCreateSchema } from "@/lib/validations/business";

export async function createClaimAction(formData: FormData) {
  const user = await requireUser();
  const businessId = String(formData.get("businessId") ?? "");
  const parsed = claimCreateSchema.safeParse({
    businessId,
    message: String(formData.get("message") ?? ""),
    proofUrl: optionalUrl(formData.get("proofUrl"))
  });

  if (!parsed.success) {
    redirect(`/claims/new?businessId=${encodeURIComponent(businessId)}&status=invalid`);
  }

  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      listingStatus: "PUBLISHED"
    },
    select: {
      id: true,
      slug: true,
      name: true
    }
  });

  if (!business) {
    redirect("/businesses");
  }

  const existingClaim = await prisma.businessClaim.findFirst({
    where: {
      businessId: business.id,
      userId: user.id,
      status: "PENDING"
    }
  });

  if (!existingClaim) {
    await prisma.businessClaim.create({
      data: {
        ...parsed.data,
        userId: user.id
      }
    });
    await notifyClaimSubmitted(business, user);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/claims");
  redirect(`/businesses/${business.slug}?claim=${existingClaim ? "already-pending" : "submitted"}`);
}

function optionalUrl(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text ? text : undefined;
}
