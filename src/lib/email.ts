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
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.tradiabusiness.com").replace(/\/$/, "");
  const logoUrl = `${baseUrl}/brand/tradia-logo.png`;
  const bannerUrl = `${baseUrl}/brand/tradia-email-banner.jpg`;
  const body = paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.7">${escapeHtml(paragraph)}</p>`)
    .join("");
  const actionHtml = action
    ? `<p style="margin:24px 0 8px"><a href="${escapeAttribute(action.url)}" style="display:inline-block;background:#047857;color:#ffffff;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:700">${escapeHtml(action.label)}</a></p>`
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#071d36">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:24px 12px">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #dbe4ee;border-radius:8px;overflow:hidden">
                <tr>
                  <td style="padding:22px 28px;background:#ffffff;border-bottom:1px solid #e2e8f0">
                    <a href="${escapeAttribute(baseUrl)}" style="text-decoration:none">
                      <img src="${escapeAttribute(logoUrl)}" width="190" alt="Tradia" style="display:block;width:190px;max-width:100%;height:auto;border:0" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img src="${escapeAttribute(bannerUrl)}" width="600" height="240" alt="Nigerian business owners growing with Tradia" style="display:block;width:100%;max-width:600px;height:auto;border:0" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 24px">
                    <p style="margin:0 0 8px;color:#ff5a1f;font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Discover. Connect. Grow.</p>
                    <h1 style="margin:0 0 20px;color:#071d36;font-size:27px;line-height:1.25">${escapeHtml(title)}</h1>
                    ${body}
                    ${actionHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;background:#071d36;color:#cbd5e1;font-size:12px;line-height:1.6">
                    <strong style="color:#ffffff">Tradia</strong><br />
                    Helping customers discover trusted businesses and Nigerian SMEs build credible digital profiles.<br />
                    <a href="${escapeAttribute(baseUrl)}" style="color:#6ee7b7;text-decoration:none">tradiabusiness.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
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
