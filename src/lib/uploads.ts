import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
]);

const maxSize = 5 * 1024 * 1024;

export async function saveUpload(file: File, folder: string) {
  validateUpload(file);

  if (hasCloudinaryConfig()) {
    return uploadToCloudinary(file, folder);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Production uploads require Cloudinary configuration.");
  }

  return saveLocalUpload(file, folder);
}

export function validateUpload(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported upload type.");
  }

  if (file.size > maxSize) {
    throw new Error("Upload exceeds 5MB.");
  }
}

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(file: File, folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = randomUUID();
  const signatureSource = `folder=tradia/${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(signatureSource);
  const formData = new FormData();

  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("folder", `tradia/${folder}`);
  formData.set("public_id", publicId);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Unable to upload file to Cloudinary.");
  }

  const result = (await response.json()) as { secure_url?: string };

  if (!result.secure_url) {
    throw new Error("Cloudinary did not return an upload URL.");
  }

  return result.secure_url;
}

async function saveLocalUpload(file: File, folder: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase() || extensionFromType(file.type);
  const safeName = `${randomUUID()}${extension}`;
  const relativePath = `/uploads/${folder}/${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  const absolutePath = path.join(uploadDir, safeName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(absolutePath, bytes);

  return relativePath.replaceAll("\\", "/");
}

async function sha1(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", bytes);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function extensionFromType(type: string) {
  if (type === "image/png") return ".png";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/webp") return ".webp";
  if (type === "application/pdf") return ".pdf";
  return "";
}
