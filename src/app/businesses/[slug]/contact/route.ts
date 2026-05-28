import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ContactRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: ContactRouteContext) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      phone: true,
      whatsapp: true,
      email: true,
      website: true,
      listingStatus: true
    }
  });

  const fallbackUrl = new URL(`/businesses/${slug}`, request.url);

  if (!business || business.listingStatus !== "PUBLISHED") {
    return NextResponse.redirect(fallbackUrl);
  }

  const destination = getContactDestination(type, business);
  if (!destination) {
    return NextResponse.redirect(fallbackUrl);
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { contactClickCount: { increment: 1 } }
  });

  return NextResponse.redirect(destination);
}

function getContactDestination(
  type: string | null,
  business: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  }
) {
  if (type === "phone" && business.phone) {
    return `tel:${business.phone}`;
  }

  if (type === "whatsapp" && (business.whatsapp || business.phone)) {
    return `https://wa.me/${(business.whatsapp ?? business.phone ?? "").replace(/\D/g, "")}`;
  }

  if (type === "email" && business.email) {
    return `mailto:${business.email}`;
  }

  if (type === "website" && business.website) {
    return business.website.startsWith("http") ? business.website : `https://${business.website}`;
  }

  return null;
}
