import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { claimCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = claimCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      listingStatus: "PUBLISHED"
    },
    select: { id: true }
  });

  if (!business) {
    return NextResponse.json({ error: "Published business not found." }, { status: 404 });
  }

  const existingClaim = await prisma.businessClaim.findFirst({
    where: {
      businessId: business.id,
      userId: user.id,
      status: "PENDING"
    }
  });

  if (existingClaim) {
    return NextResponse.json({ data: existingClaim }, { status: 200 });
  }

  const claim = await prisma.businessClaim.create({
    data: {
      ...parsed.data,
      businessId: business.id,
      userId: user.id
    }
  });

  return NextResponse.json({ data: claim }, { status: 201 });
}
