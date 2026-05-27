type SquadInitInput = {
  email: string;
  customerName: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

type SquadVerifyResponse = {
  status: number;
  success: boolean;
  message: string;
  data?: {
    transaction_amount?: number;
    transaction_ref?: string;
    transaction_status?: string;
    transaction_currency_id?: string;
    created_at?: string;
    meta?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
};

function squadBaseUrl() {
  return process.env.SQUAD_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? "https://api-d.squadco.com"
    : "https://sandbox-api-d.squadco.com";
}

function squadSecretKey() {
  const secret = process.env.SQUAD_SECRET_KEY?.trim();

  if (!secret) {
    throw new Error("SQUAD_SECRET_KEY is not configured");
  }

  return secret;
}

export async function initializeSquadPayment(input: SquadInitInput) {
  const response = await fetch(`${squadBaseUrl()}/transaction/initiate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${squadSecretKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: input.amountKobo,
      email: input.email,
      customer_name: input.customerName,
      currency: "NGN",
      initiate_type: "inline",
      transaction_ref: input.reference,
      callback_url: input.callbackUrl,
      payment_channels: ["card", "bank", "ussd", "transfer"],
      metadata: input.metadata
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Squad initialize failed", {
      status: response.status,
      environment: process.env.SQUAD_ENVIRONMENT,
      body: body.slice(0, 500)
    });
    throw new Error(`Squad initialize failed with status ${response.status}`);
  }

  return response.json();
}

export async function verifySquadTransaction(reference: string): Promise<SquadVerifyResponse> {
  const response = await fetch(`${squadBaseUrl()}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${squadSecretKey()}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to verify Squad transaction");
  }

  return response.json();
}
