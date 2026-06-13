import { paragraphEmail, sendEmail } from "@/lib/email";

export type BroadcastChannel = "EMAIL" | "SMS" | "WHATSAPP";

type BroadcastRecipient = {
  name: string;
  email: string;
  phone: string | null;
};

export async function sendAdminBroadcast(input: {
  channel: BroadcastChannel;
  recipient: BroadcastRecipient;
  subject: string;
  message: string;
}) {
  if (input.channel === "EMAIL") {
    const result = await sendEmail({
      to: input.recipient.email,
      subject: input.subject,
      text: input.message,
      html: paragraphEmail(input.subject, [`Hi ${input.recipient.name},`, input.message])
    });

    return deliverySucceeded(result);
  }

  if (!input.recipient.phone) return false;
  return sendTermiiMessage(input.recipient.phone, input.message, input.channel);
}

async function sendTermiiMessage(destination: string, message: string, channel: "SMS" | "WHATSAPP") {
  const apiKey = process.env.TERMII_API_KEY?.trim();
  if (!apiKey) return false;

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: destination,
      from: process.env.TERMII_SENDER_ID?.trim() || "Tradia",
      sms: message,
      type: "plain",
      channel: channel === "WHATSAPP" ? "whatsapp" : "generic"
    })
  });

  return response.ok;
}

function deliverySucceeded(result: unknown) {
  if (!result || typeof result !== "object") return true;
  const status = result as { skipped?: boolean; failed?: boolean };
  return !status.skipped && !status.failed;
}
