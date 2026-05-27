import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        message: error instanceof Error ? error.message : "Health check failed",
        checkedAt: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
