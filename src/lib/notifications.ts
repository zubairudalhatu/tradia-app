import { paragraphEmail, sendEmail } from "@/lib/email";

type NotificationBusiness = {
  id: string;
  name: string;
  slug?: string;
  owner?: {
    name: string;
    email: string;
  } | null;
};

function appUrl(path = "/") {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

function adminEmail() {
  return process.env.TRADIA_SUPPORT_EMAIL || "tradia@zamkah.com.ng";
}

export async function notifyBusinessSubmitted(business: NotificationBusiness) {
  await Promise.all([
    sendEmail({
      to: adminEmail(),
      subject: `New business submitted: ${business.name}`,
      html: paragraphEmail("New business submitted", [
        `${business.name} has been submitted for review on Tradia.`,
        "Open the admin panel to review, edit, approve, or reject the listing."
      ], { label: "Open Admin", url: appUrl("/admin") })
    }),
    business.owner?.email
      ? sendEmail({
          to: business.owner.email,
          subject: "Your Tradia business submission is under review",
          html: paragraphEmail("Submission received", [
            `Hi ${business.owner.name},`,
            `${business.name} has been submitted successfully and is now waiting for admin approval.`
          ], { label: "Go to Dashboard", url: appUrl("/dashboard") })
        })
      : Promise.resolve()
  ]);
}

export async function notifyBusinessDecision(business: NotificationBusiness, status: "approved" | "rejected") {
  if (!business.owner?.email) return;

  await sendEmail({
    to: business.owner.email,
    subject: `Your Tradia listing was ${status}`,
    html: paragraphEmail(`Business ${status}`, [
      `Hi ${business.owner.name},`,
      `${business.name} has been ${status} on Tradia.`
    ], { label: "Go to Dashboard", url: appUrl("/dashboard") })
  });
}

export async function notifyVerificationSubmitted(business: NotificationBusiness, documentType: string) {
  await sendEmail({
    to: adminEmail(),
    subject: `Verification request: ${business.name}`,
    html: paragraphEmail("New verification request", [
      `${business.name} submitted a ${documentType} for verification.`,
      "Open Admin to review the uploaded document and approve or reject the request."
    ], { label: "Open Admin", url: appUrl("/admin") })
  });
}

export async function notifyVerificationDecision(
  business: NotificationBusiness,
  recipient: { name: string; email: string },
  status: "approved" | "rejected"
) {
  await sendEmail({
    to: recipient.email,
    subject: `Your Tradia verification was ${status}`,
    html: paragraphEmail(`Verification ${status}`, [
      `Hi ${recipient.name},`,
      `${business.name}'s verification request has been ${status}.`
    ], { label: "Go to Dashboard", url: appUrl("/dashboard") })
  });
}

export async function notifyPaymentSuccess(
  business: NotificationBusiness,
  recipient: { name: string; email: string },
  planName: string,
  amount: number
) {
  await sendEmail({
    to: recipient.email,
    subject: "Your Tradia payment was successful",
    html: paragraphEmail("Payment successful", [
      `Hi ${recipient.name},`,
      `Your ${planName} plan payment for ${business.name} was successful.`,
      `Amount received: NGN ${amount.toLocaleString("en-NG")}.`
    ], { label: "Go to Dashboard", url: appUrl("/dashboard") })
  });
}
