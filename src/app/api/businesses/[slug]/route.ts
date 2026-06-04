import { NextResponse } from "next/server";
import { getBusinessBySlug } from "@/lib/queries/businesses";

type BusinessDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: BusinessDetailRouteProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || business.listingStatus !== "PUBLISHED") {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: business.id,
      slug: business.slug,
      name: business.name,
      description: business.description,
      address: business.address,
      averageRating: Number(business.averageRating),
      reviewCount: business.reviewCount,
      verificationStatus: business.verificationStatus,
      verificationGrantedAt: business.verificationGrantedAt,
      verificationRevokedAt: business.verificationRevokedAt,
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      website: business.website,
      logoUrl: business.logoUrl,
      coverUrl: business.coverUrl,
      coverCropX: business.coverCropX,
      coverCropY: business.coverCropY,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      category: {
        name: business.category.name,
        slug: business.category.slug
      },
      location: {
        name: business.location.name,
        slug: business.location.slug,
        state: business.location.state,
        type: business.location.type
      },
      plan: business.plan
        ? {
            name: business.plan.name,
            canBeFeatured: business.plan.canBeFeatured,
            analyticsEnabled: business.plan.analyticsEnabled
          }
        : null,
      featuredPlacements: business.featuredPlacements.map((placement) => ({
        id: placement.id,
        placementType: placement.placementType
      })),
      media: business.media.map((item) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        createdAt: item.createdAt
      })),
      hours: business.hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt,
        closesAt: hour.closesAt,
        isClosed: hour.isClosed
      })),
      reviews: business.reviews.slice(0, 5).map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        ownerResponse: review.ownerResponse,
        userName: review.user.name,
        createdAt: review.createdAt
      }))
    }
  });
}
