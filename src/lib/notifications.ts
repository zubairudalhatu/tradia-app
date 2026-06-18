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

export async function notifyClaimSubmitted(
  business: NotificationBusiness,
  claimant: { name: string; email: string }
) {
  await Promise.all([
    sendEmail({
      to: adminEmail(),
      subject: `Business ownership claim: ${business.name}`,
      html: paragraphEmail("New business ownership claim", [
        `${claimant.name} (${claimant.email}) submitted an ownership claim for ${business.name}.`,
        "Review the claimant's explanation and proof before transferring ownership."
      ], { label: "Review Claims", url: appUrl("/admin/claims") })
    }),
    sendEmail({
      to: claimant.email,
      subject: `Your Tradia claim for ${business.name} was received`,
      html: paragraphEmail("Claim received", [
        `Hi ${claimant.name},`,
        `Your ownership claim for ${business.name} is waiting for admin review. Tradia may contact you if more proof is needed.`
      ], { label: "View Business", url: appUrl(`/businesses/${business.slug}`) })
    })
  ]);
}

export async function notifyClaimDecision(
  business: NotificationBusiness,
  claimant: { name: string; email: string },
  status: "approved" | "rejected",
  adminNotes?: string | null
) {
  await sendEmail({
    to: claimant.email,
    subject: `Your Tradia ownership claim was ${status}`,
    html: paragraphEmail(`Ownership claim ${status}`, [
      `Hi ${claimant.name},`,
      `Your claim for ${business.name} was ${status}.`,
      adminNotes ? `Admin note: ${adminNotes}` : "",
      status === "approved" ? "The business is now connected to your Tradia account." : "You may submit a new claim later with clearer ownership proof."
    ].filter(Boolean), status === "approved"
      ? { label: "Manage Business", url: appUrl("/dashboard") }
      : { label: "View Business", url: appUrl(`/businesses/${business.slug}`) })
  });
}

export async function notifyPreviousOwnerClaimTransfer(
  business: NotificationBusiness,
  previousOwner: { name: string; email: string },
  newOwner: { name: string; email: string }
) {
  await sendEmail({
    to: previousOwner.email,
    subject: `Ownership updated for ${business.name} on Tradia`,
    html: paragraphEmail("Business ownership updated", [
      `Hi ${previousOwner.name},`,
      `After reviewing an ownership claim, Tradia assigned ${business.name} to ${newOwner.name} (${newOwner.email}).`,
      "If you believe this transfer is incorrect, contact Tradia Support promptly with your ownership evidence."
    ], { label: "Contact Support", url: appUrl("/contact#support-form") })
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

export async function notifyWalletTopUpSuccess(
  recipient: { name: string; email: string },
  amount: number
) {
  await sendEmail({
    to: recipient.email,
    subject: "Your Tradia wallet has been funded",
    html: paragraphEmail("Wallet funded", [
      `Hi ${recipient.name},`,
      `Your Tradia wallet top-up of ${formatNaira(amount)} was successful.`,
      "You can now use your wallet balance for homepage featuring, Business Starter Kit, Verified Business Kit, and other Tradia add-ons."
    ], { label: "Open Account", url: appUrl("/account") })
  });
}

export async function notifyWalletAddOnPurchased(
  business: NotificationBusiness,
  recipient: { name: string; email: string },
  productName: string,
  amount: number,
  fulfillmentStatus: "OPEN" | "FULFILLED"
) {
  await sendEmail({
    to: recipient.email,
    subject: `Tradia add-on purchased: ${productName}`,
    html: paragraphEmail("Add-on purchased", [
      `Hi ${recipient.name},`,
      `Your ${productName} purchase for ${business.name} was successful.`,
      `Amount paid from wallet: ${formatNaira(amount)}.`,
      fulfillmentStatus === "FULFILLED"
        ? "This add-on has been fulfilled automatically."
        : "Your order is open. The Tradia team will update the status after fulfillment."
    ], { label: "View Add-on Orders", url: appUrl("/account") })
  });
}

export async function notifyAdminWalletAddOnPurchased(
  business: NotificationBusiness,
  buyer: { name: string; email: string },
  productName: string,
  amount: number,
  reference: string
) {
  await sendEmail({
    to: adminEmail(),
    subject: `Wallet add-on needs fulfillment: ${productName}`,
    html: paragraphEmail("Wallet add-on needs fulfillment", [
      `${buyer.name} purchased ${productName} for ${business.name}.`,
      `Amount paid: ${formatNaira(amount)}.`,
      `Reference: ${reference}.`,
      "Open Admin to fulfill the order or contact the customer if needed."
    ], { label: "Open Admin", url: appUrl("/admin") })
  });
}

export async function notifyWalletAddOnFulfillmentUpdated(
  business: NotificationBusiness | null,
  recipient: { name: string; email: string },
  productName: string,
  fulfillmentStatus: "OPEN" | "FULFILLED"
) {
  await sendEmail({
    to: recipient.email,
    subject: `Tradia add-on ${fulfillmentStatus === "FULFILLED" ? "fulfilled" : "reopened"}`,
    html: paragraphEmail(`Add-on ${fulfillmentStatus === "FULFILLED" ? "fulfilled" : "reopened"}`, [
      `Hi ${recipient.name},`,
      `${productName}${business ? ` for ${business.name}` : ""} is now marked ${fulfillmentStatus.toLowerCase()}.`,
      fulfillmentStatus === "FULFILLED"
        ? "Thank you for using Tradia add-ons to grow your business visibility."
        : "The Tradia team has reopened this order and will follow up."
    ], { label: "View Add-on Orders", url: appUrl("/account") })
  });
}

export async function notifySubscriptionRenewalDue(
  business: NotificationBusiness,
  recipient: { name: string; email: string },
  planName: string,
  endsAt: Date,
  daysBefore: number
) {
  await sendEmail({
    to: recipient.email,
    subject: `Your Tradia ${planName} plan renews soon`,
    html: paragraphEmail("Plan renewal reminder", [
      `Hi ${recipient.name},`,
      `${business.name}'s ${planName} plan ends on ${endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}.`,
      `Renew within ${daysBefore} day${daysBefore === 1 ? "" : "s"} to keep premium visibility, verification eligibility, media limits, and analytics active.`
    ], { label: "Renew Plan", url: appUrl("/pricing") })
  });
}

export async function notifySubscriptionExpired(
  business: NotificationBusiness,
  recipient: { name: string; email: string },
  planName: string,
  endedAt: Date
) {
  await sendEmail({
    to: recipient.email,
    subject: `Your Tradia ${planName} plan has expired`,
    html: paragraphEmail("Plan expired", [
      `Hi ${recipient.name},`,
      `${business.name}'s ${planName} plan expired on ${endedAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}.`,
      "Free plan benefits now apply until the business renews."
    ], { label: "Renew Plan", url: appUrl("/pricing") })
  });
}

export async function notifyBusinessLead(
  business: NotificationBusiness,
  lead: { name: string; email?: string | null; phone?: string | null; message: string }
) {
  if (!business.owner?.email) return;

  await sendEmail({
    to: business.owner.email,
    subject: `New Tradia enquiry for ${business.name}`,
    html: paragraphEmail("New business enquiry", [
      `Hi ${business.owner.name},`,
      `${lead.name} sent an enquiry for ${business.name}.`,
      lead.email ? `Email: ${lead.email}` : "",
      lead.phone ? `Phone: ${lead.phone}` : "",
      `Message: ${lead.message}`
    ].filter(Boolean), { label: "Open Dashboard", url: appUrl("/dashboard") })
  });
}

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}
