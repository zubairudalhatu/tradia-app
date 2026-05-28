"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"));

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  if (user.status !== "ACTIVE") {
    redirect("/login?error=suspended");
  }

  await createSession(user.id);
  redirect(nextPath ?? (user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  const nextPath = String(value ?? "").trim();

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return null;

  return nextPath;
}
