import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyVerificationSubmitted } from "@/lib/notifications";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { verificationCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = verificationCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      ownerId: user.id
    },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      }
    }
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found or not owned by current user." }, { status: 404 });
  }

  const { benefits } = getBusinessPlanState(business);

  if (!benefits.canRequestVerification) {
    return NextResponse.json({ error: "This business plan cannot request verification." }, { status: 403 });
  }

  const verificationRequest = await prisma.verificationRequest.create({
    data: {
      ...parsed.data,
      businessId: business.id,
      submittedBy: user.id,
      status: "PENDING"
    }
  });

  await prisma.business.update({
    where: { id: business.id },
    data: { verificationStatus: "PENDING" }
  });

  await notifyVerificationSubmitted(
    {
      id: business.id,
      name: business.name,
      slug: business.slug,
      owner: { name: user.name, email: user.email }
    },
    parsed.data.documentType
  );

  return NextResponse.json({ data: verificationRequest }, { status: 201 });
}
