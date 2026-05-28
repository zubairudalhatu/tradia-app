"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyBusinessLead } from "@/lib/notifications";

export async function submitReviewAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const rating = Number(formData.get("rating"));
  const title = optionalString(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 10) {
    redirect(`/businesses/${slug}?review=invalid`);
  }

  await prisma.review.upsert({
    where: {
      businessId_userId: {
        businessId,
        userId: user.id
      }
    },
    update: {
      rating,
      title,
      body,
      status: "PENDING"
    },
    create: {
      businessId,
      userId: user.id,
      rating,
      title,
      body,
      status: "PENDING"
    }
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath("/admin");
  redirect(`/businesses/${slug}?review=submitted`);
}

export async function reportBusinessAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get("type") ?? "Business report").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10) {
    redirect(`/businesses/${slug}?report=invalid`);
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      businessId,
      type,
      message
    }
  });

  revalidatePath("/admin");
  redirect(`/businesses/${slug}?report=submitted`);
}

export async function reportReviewAction(businessId: string, reviewId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10) {
    redirect(`/businesses/${slug}?report=invalid`);
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      businessId,
      reviewId,
      type: "Review report",
      message
    }
  });

  revalidatePath("/admin");
  redirect(`/businesses/${slug}?report=submitted`);
}

export async function submitBusinessLeadAction(businessId: string, slug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = optionalString(formData.get("email"));
  const phone = optionalString(formData.get("phone"));
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || message.length < 10 || (!email && !phone)) {
    redirect(`/businesses/${slug}?enquiry=invalid`);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true }
  });

  if (!business || business.listingStatus !== "PUBLISHED") {
    redirect(`/businesses/${slug}?enquiry=invalid`);
  }

  const lead = await prisma.contactLead.create({
    data: {
      businessId,
      name,
      email,
      phone,
      message
    }
  });

  await notifyBusinessLead(business, lead);
  revalidatePath("/dashboard");
  redirect(`/businesses/${slug}?enquiry=submitted`);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}
