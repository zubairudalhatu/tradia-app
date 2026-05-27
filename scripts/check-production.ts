import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_PUBLIC_KEY"
];

const recommended = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

if (missingRequired.length > 0) {
  console.error(`Missing required production env vars: ${missingRequired.join(", ")}`);
  process.exit(1);
}

if (process.env.NEXTAUTH_URL?.includes("localhost")) {
  console.error("NEXTAUTH_URL must be the real production website URL, not localhost.");
  process.exit(1);
}

if (process.env.DATABASE_URL?.includes("localhost")) {
  console.error("DATABASE_URL must point to the production PostgreSQL database, not localhost.");
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`Recommended before launch: ${missingRecommended.join(", ")}`);
}

console.log("Production environment check passed.");
