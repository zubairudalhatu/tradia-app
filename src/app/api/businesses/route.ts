import { NextResponse } from "next/server";
import { businessCreateSchema } from "@/lib/validations/business";
import { createBusiness, listPublishedBusinesses } from "@/lib/queries/businesses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businesses = await listPublishedBusinesses({
    q: cleanQueryParam(searchParams.get("q")),
    category: cleanQueryParam(searchParams.get("category")),
    location: cleanQueryParam(searchParams.get("location")),
    verified: isTruthy(searchParams.get("verified")),
    open: isTruthy(searchParams.get("open")),
    limit: parsePositiveInt(searchParams.get("limit")),
    page: parsePositiveInt(searchParams.get("page"))
  });

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

function cleanQueryParam(value: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function isTruthy(value: string | null) {
  return ["1", "true", "yes"].includes(value?.toLowerCase() ?? "");
}

function parsePositiveInt(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
