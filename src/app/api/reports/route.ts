import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { reportCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reportCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const target = await resolveReportTarget(parsed.data.businessId, parsed.data.reviewId);

  if (!target) {
    return NextResponse.json({ error: "Report target not found." }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      businessId: target.businessId,
      reviewId: target.reviewId,
      type: parsed.data.reviewId ? "Review report" : parsed.data.type,
      message: parsed.data.message
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/businesses/${target.businessSlug}`);

  return NextResponse.json({ data: report }, { status: 201 });
}

async function resolveReportTarget(businessId?: string, reviewId?: string) {
  if (reviewId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: {
          select: {
            id: true,
            slug: true,
            listingStatus: true
          }
        }
      }
    });

    if (!review || review.business.listingStatus !== "PUBLISHED") return null;

    return {
      businessId: review.business.id,
      businessSlug: review.business.slug,
      reviewId: review.id
    };
  }

  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      listingStatus: "PUBLISHED"
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!business) return null;

  return {
    businessId: business.id,
    businessSlug: business.slug,
    reviewId: undefined
  };
}
