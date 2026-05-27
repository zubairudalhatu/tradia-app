"use server";

import { redirect } from "next/navigation";
import { createBusiness } from "@/lib/queries/businesses";
import { businessCreateSchema } from "@/lib/validations/business";
import { getCurrentUser } from "@/lib/auth/session";

export async function submitBusinessAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/businesses/new");
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

  await createBusiness(parsed.data, user.id);
  redirect("/dashboard?submitted=1");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}
