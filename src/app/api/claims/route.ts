import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { claimCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = claimCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const claim = await prisma.businessClaim.create({
    data: {
      ...parsed.data,
      userId: "system-seed-user"
    }
  });

  return NextResponse.json({ data: claim }, { status: 201 });
}
