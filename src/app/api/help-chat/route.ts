import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const requestWindows = new Map<string, { count: number; resetAt: number }>();
const systemPrompt = `
You are Tradia Help Assistant for tradiabusiness.com, a Nigerian business directory.
Answer only questions about using Tradia. Be concise, friendly, and practical.

Important Tradia facts:
- Anyone can list a business free at /businesses/new.
- Users can find businesses at /businesses.
- Owners can manage listings and request verification from /dashboard.
- Plans and benefits are shown at /pricing.
- Wallet funding, add-on orders, payment history, and receipts are at /account.
- Abuse reports are submitted at /support/report-abuse.
- Tutorials are at /support/tutorials and the knowledge base is at /support/knowledge-base.
- Support requests are submitted at /contact#support-form.

Never claim that a business is trustworthy merely because it is listed.
Never reveal, request, or guess passwords, payment card details, API keys, verification codes, or private account information.
Do not make promises about verification approval, refunds, or support response times.
If a question requires account-specific investigation, payment investigation, human judgment, or is outside Tradia, direct the user to /contact#support-form.
When useful, include one relevant Tradia path in your answer.
`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4.1-mini";

  if (!apiKey) {
    return NextResponse.json({ error: "Live chat is not configured yet." }, { status: 503 });
  }

  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (isRateLimited(clientId)) {
    return NextResponse.json({ error: "Please wait a moment before asking another question." }, { status: 429 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = normalizeMessages(body.messages);
  if (!messages.length || messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "Enter a question for Tradia Help." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: messages.map((message) => ({
          role: message.role,
          content: [{ type: "input_text", text: message.content }]
        })),
        max_output_tokens: 300
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI help chat failed", { status: response.status, body: errorBody.slice(0, 300) });
      return NextResponse.json({ error: "Live chat is temporarily unavailable. Please use Tradia Support." }, { status: 502 });
    }

    const result = await response.json() as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const answer = result.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")
      ?.text?.trim();

    if (!answer) {
      return NextResponse.json({ error: "Live chat could not answer that question. Please use Tradia Support." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("OpenAI help chat request error", error);
    return NextResponse.json({ error: "Live chat is temporarily unavailable. Please use Tradia Support." }, { status: 502 });
  }
}

function normalizeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(-8).flatMap((message): ChatMessage[] => {
    if (!message || typeof message !== "object") return [];
    const role = "role" in message ? message.role : null;
    const content = "content" in message ? message.content : null;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const cleanContent = content.trim().slice(0, 700);
    return cleanContent ? [{ role, content: cleanContent }] : [];
  });
}

function isRateLimited(clientId: string) {
  const now = Date.now();
  const current = requestWindows.get(clientId);

  if (!current || current.resetAt <= now) {
    requestWindows.set(clientId, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > 10;
}
