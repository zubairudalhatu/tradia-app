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
