import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReceiptDownloadButton } from "@/components/receipt-download-button";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type AdminWalletReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adminActionToken?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminWalletReceiptPage({ params, searchParams }: AdminWalletReceiptPageProps) {
  const [{ id }, query, sessionUser] = await Promise.all([params, searchParams, getCurrentUser()]);
  const user = sessionUser ?? await getAdminFromActionToken(query.adminActionToken);

  if (!user) redirect(`/login?next=/admin/wallet/${id}/receipt`);
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const transaction = await prisma.walletTransaction.findUnique({
    where: { id },
    include: {
      user: true,
      business: true,
      payment: true
    }
  });

  if (!transaction) notFound();

  const metadata = walletMetadata(transaction.metadata);
  const productName = metadataString(metadata, "productName") || transaction.description;
  const productCode = metadataString(metadata, "productCode");
  const fulfillmentStatus = metadataString(metadata, "fulfillmentStatus") || (transaction.type === "CREDIT" ? "SUCCESS" : "OPEN");
  const fulfillmentNote = metadataString(metadata, "fulfillmentNote");
  const fulfilledAt = metadataString(metadata, "fulfilledAt");
  const paymentReference = transaction.payment?.providerReference ?? metadataString(metadata, "paymentReference");

  return (
    <main className="receipt-print-shell mx-auto max-w-3xl px-5 py-12">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href="/admin">
          Back to Admin
        </Link>
        <ReceiptDownloadButton />
      </div>

      <section className="receipt-print-card rounded-tradia border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <Image src="/brand/tradia-logo.png" alt="Tradia" width={180} height={52} priority />
            <p className="mt-4 text-sm font-bold text-slate-600">Zamkah Technologies Limited</p>
            <p className="text-sm text-slate-500">tradia@zamkah.com.ng</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-extrabold uppercase text-ember">Admin Wallet Receipt</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">{formatAmount(transaction.amount, transaction.currency)}</h1>
            <p className="mt-1 text-sm font-bold text-forest">{transaction.type === "CREDIT" ? "Wallet top-up" : "Wallet add-on"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ReceiptField label="Receipt ID" value={transaction.id} />
          <ReceiptField label="Wallet reference" value={transaction.reference} />
          <ReceiptField label="Date" value={transaction.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} />
          <ReceiptField label="Customer" value={transaction.user.name} />
          <ReceiptField label="Customer email" value={transaction.user.email} />
          <ReceiptField label="Transaction type" value={transaction.type === "CREDIT" ? "Wallet top-up" : "Wallet spend"} />
          <ReceiptField label="Item" value={productName} />
          <ReceiptField label="Business" value={transaction.business?.name ?? "Account wallet"} />
          <ReceiptField label="Status" value={formatStatus(fulfillmentStatus)} />
          {productCode ? <ReceiptField label="Product code" value={productCode} /> : null}
          {fulfilledAt ? <ReceiptField label="Fulfilled at" value={new Date(fulfilledAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} /> : null}
          {transaction.payment ? <ReceiptField label="Payment provider" value={transaction.payment.provider} /> : null}
          {paymentReference ? <ReceiptField label="Payment reference" value={paymentReference} /> : null}
        </div>

        {fulfillmentNote ? (
          <div className="receipt-note mt-8 rounded-tradia bg-slate-50 p-5">
            <h2 className="text-lg font-black">Fulfillment note</h2>
            <p className="mt-2 text-sm text-slate-600">{fulfillmentNote}</p>
          </div>
        ) : null}

        <p className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          This admin receipt confirms wallet activity recorded by Tradia. Use the wallet and provider references for support and reconciliation.
        </p>
      </section>
    </main>
  );
}

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="receipt-field rounded-tradia border border-slate-200 p-4">
      <p className="text-xs font-extrabold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function walletMetadata(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
