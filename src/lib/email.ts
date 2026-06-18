type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const resendEndpoint = "https://api.resend.com/emails";

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.TRADIA_EMAIL_FROM?.trim() || "Tradia <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("Email skipped because RESEND_API_KEY is not configured", {
      to: input.to,
      subject: input.subject
    });
    return { skipped: true };
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Email send failed", {
      status: response.status,
      subject: input.subject,
      body: body.slice(0, 500)
    });
    return { skipped: false, failed: true, status: response.status };
  }

  return response.json();
}

export function paragraphEmail(title: string, paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const actionHtml = action
    ? `<p><a href="${escapeAttribute(action.url)}" style="display:inline-block;background:#047857;color:#ffffff;padding:12px 16px;border-radius:6px;text-decoration:none;font-weight:700">${escapeHtml(action.label)}</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;color:#071d36;line-height:1.6">
      <h1 style="font-size:24px">${escapeHtml(title)}</h1>
      ${body}
      ${actionHtml}
      <p style="color:#64748b;font-size:13px">Tradia - Discover. Connect. Grow.</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
