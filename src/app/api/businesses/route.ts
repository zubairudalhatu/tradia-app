import { NextResponse } from "next/server";
import { businessCreateSchema } from "@/lib/validations/business";
import { createBusiness, listPublishedBusinesses } from "@/lib/queries/businesses";

export async function GET() {
  const businesses = await listPublishedBusinesses();
  return NextResponse.json({ data: businesses });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = businessCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const business = await createBusiness(parsed.data);

  return NextResponse.json({ data: business }, { status: 201 });
}
