import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reviewCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewCreateSchema.safeParse({
    ...body,
    rating: Number(body?.rating)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      listingStatus: "PUBLISHED"
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!business) {
    return NextResponse.json({ error: "Published business not found." }, { status: 404 });
  }

  const review = await prisma.review.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: user.id
      }
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      status: "PENDING"
    },
    create: {
      businessId: business.id,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      status: "PENDING"
    }
  });

  revalidatePath(`/businesses/${business.slug}`);
  revalidatePath("/admin");

  return NextResponse.json({ data: review }, { status: 201 });
}
