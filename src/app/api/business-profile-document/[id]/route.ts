import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";

const MAX_PROFILE_PDF_BYTES = 20 * 1024 * 1024;
const PROFILE_DOCUMENT_TITLE_PREFIX = "Company profile:";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const business = await prisma.business.findFirst({
    where: { id, ownerId: user.id },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      }
    }
  });

  if (!business) {
    return NextResponse.json({ error: "You cannot update this business." }, { status: 403 });
  }

  const planState = getBusinessPlanState(business);

  if (!planState.benefits.profilePdfEnabled) {
    return NextResponse.json({ error: "A Platinum plan is required for a company profile PDF." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (body?.action === "sign") {
    return createUploadSignature(business.id);
  }

  if (body?.action !== "complete") {
    return NextResponse.json({ error: "Unsupported upload request." }, { status: 400 });
  }

  const url = String(body.url ?? "");
  const publicId = String(body.publicId ?? "");
  const originalName = sanitizeFileName(String(body.originalName ?? "Company profile.pdf"));
  const bytes = Number(body.bytes);
  const format = String(body.format ?? "").toLowerCase();
  const resourceType = String(body.resourceType ?? "").toLowerCase();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const expectedPrefix = `tradia/businesses/${business.id}/profile-documents/`;

  if (
    !cloudName ||
    !isTrustedCloudinaryUrl(url, cloudName) ||
    !publicId.startsWith(expectedPrefix) ||
    resourceType !== "raw" ||
    format !== "pdf" ||
    !Number.isFinite(bytes) ||
    bytes <= 0 ||
    bytes > MAX_PROFILE_PDF_BYTES
  ) {
    return NextResponse.json({ error: "Cloudinary returned an invalid PDF upload." }, { status: 400 });
  }

  const document = await prisma.$transaction(async (tx) => {
    await tx.media.deleteMany({
      where: {
        businessId: business.id,
        type: "DOCUMENT",
        title: { startsWith: PROFILE_DOCUMENT_TITLE_PREFIX }
      }
    });

    return tx.media.create({
      data: {
        businessId: business.id,
        userId: user.id,
        type: "DOCUMENT",
        url,
        title: `${PROFILE_DOCUMENT_TITLE_PREFIX} ${originalName}`
      }
    });
  });

  revalidatePath(`/businesses/${business.slug}`);
  revalidatePath("/pricing");

  return NextResponse.json({ id: document.id, url: document.url, title: document.title });
}

function createUploadSignature(businessId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Document storage is not configured." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `tradia/businesses/${businessId}/profile-documents`;
  const publicId = `${folder}/${randomUUID()}`;
  const signatureSource = `allowed_formats=pdf&folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signatureSource).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, publicId, signature });
}

function isTrustedCloudinaryUrl(value: string, cloudName: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/raw/upload/`) &&
      url.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function sanitizeFileName(value: string) {
  const safe = value.replace(/[^a-zA-Z0-9._() -]/g, "").trim().slice(0, 120);
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe || "Company profile"}.pdf`;
}
