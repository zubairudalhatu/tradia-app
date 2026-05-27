import { createHmac } from "node:crypto";

type PaystackInitInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function initializePaystackPayment(input: PaystackInitInput) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata
    })
  });

  if (!response.ok) {
    throw new Error("Unable to initialize Paystack transaction");
  }

  return response.json();
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to verify Paystack transaction");
  }

  return response.json();
}

export function verifyPaystackSignature(payload: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;

  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return expected === signature;
}
