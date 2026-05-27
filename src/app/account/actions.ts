"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function updateAccountAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?next=/account");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = optionalString(formData.get("phone"));

  if (name.length < 2) {
    redirect("/account?error=invalid");
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone
      }
    });
  } catch {
    redirect("/account?error=phone");
  }

  redirect("/account?saved=1");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}
