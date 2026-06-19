"use server";

import { redirect } from "next/navigation";
import { isUserAccountVerified } from "@/lib/account-verification";
import { createAuditLog } from "@/lib/audit";
import { createBusiness, findPotentialBusinessDuplicates } from "@/lib/queries/businesses";
import { businessCreateSchema } from "@/lib/validations/business";
import { getCurrentUser } from "@/lib/auth/session";
import { notifyBusinessSubmitted } from "@/lib/notifications";
import { prisma } from "@/lib/db";

export async function submitBusinessAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/businesses/new");
  }

  if (!isUserAccountVerified(user)) {
    redirect("/verify-account");
  }

  const parsed = businessCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    locationId: formData.get("locationId"),
    address: formData.get("address"),
    phone: optionalString(formData.get("phone")),
    whatsapp: optionalString(formData.get("whatsapp")),
    email: optionalString(formData.get("email")),
    website: optionalString(formData.get("website"))
  });

  if (!parsed.success) {
    redirect("/businesses/new?error=invalid");
  }

  const [selectedLocation, duplicateCandidates] = await Promise.all([
    prisma.location.findUnique({ where: { id: parsed.data.locationId }, select: { id: true, parentId: true } }),
    findPotentialBusinessDuplicates(parsed.data.name, 10)
  ]);
  const selectedStateId = selectedLocation?.parentId ?? selectedLocation?.id;
  const duplicate = duplicateCandidates.find((candidate) =>
    candidate.score >= 0.94 && candidate.location.parentId === selectedStateId
  );
  if (duplicate) redirect("/businesses/new?error=duplicate");

  const business = await createBusiness(parsed.data, user.id);
  await createAuditLog({
    actorId: user.id,
    action: "BUSINESS_LISTING_SUBMITTED",
    entityType: "Business",
    entityId: business.id,
    metadata: {
      businessName: business.name,
      source: "owner_onboarding"
    }
  });
  try {
    await notifyBusinessSubmitted({
      id: business.id,
      name: business.name,
      slug: business.slug,
      owner: user
    });
  } catch (error) {
    console.error("Business submission notification failed", error);
  }

  redirect("/dashboard?submitted=1");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}
