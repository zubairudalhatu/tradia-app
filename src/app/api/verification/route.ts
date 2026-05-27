import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificationCreateSchema } from "@/lib/validations/business";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = verificationCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const verificationRequest = await prisma.verificationRequest.create({
    data: {
      ...parsed.data,
      submittedBy: "system-seed-user"
    }
  });

  return NextResponse.json({ data: verificationRequest }, { status: 201 });
}
