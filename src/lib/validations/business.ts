import { z } from "zod";

export const businessCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  address: z.string().min(5),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional()
});

export const claimCreateSchema = z.object({
  businessId: z.string().min(1),
  message: z.string().min(10),
  proofUrl: z.string().url().optional()
});

export const verificationCreateSchema = z.object({
  businessId: z.string().min(1),
  documentType: z.string().min(2),
  documentUrl: z.string().url(),
  notes: z.string().optional()
});

export const reviewCreateSchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).optional(),
  body: z.string().trim().min(10)
});

export const reportCreateSchema = z.object({
  businessId: z.string().min(1).optional(),
  reviewId: z.string().min(1).optional(),
  type: z.string().trim().min(2).default("Business report"),
  message: z.string().trim().min(10)
}).refine((input) => input.businessId || input.reviewId, {
  message: "A businessId or reviewId is required.",
  path: ["businessId"]
});
