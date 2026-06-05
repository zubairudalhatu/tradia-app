import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReceiptDownloadButton } from "@/components/receipt-download-button";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function PaymentReceiptPage({ params }: ReceiptPageProps) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);

  if (!user) redirect(`/login?next=/account/payments/${id}/receipt`);

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      userId: user.id,
      status: "SUCCESS"
    },
    include: {
      user: true,
      business: true,
      subscription: {
        include: { plan: true }
      }
    }
  });

  if (!payment) notFound();

  const paidAt = payment.paidAt ?? payment.createdAt;

  return (
    <main className="receipt-print-shell mx-auto max-w-3xl px-5 py-12">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink" href="/account">
          Back to Account
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
            <p className="text-sm font-extrabold uppercase text-ember">Payment Receipt</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">{formatAmount(payment.amount, payment.currency)}</h1>
            <p className="mt-1 text-sm font-bold text-forest">{payment.status}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ReceiptField label="Receipt ID" value={payment.id} />
          <ReceiptField label="Payment date" value={paidAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} />
          <ReceiptField label="Customer" value={payment.user.name} />
          <ReceiptField label="Customer email" value={payment.user.email} />
          <ReceiptField label="Business" value={payment.business?.name ?? "Business subscription"} />
          <ReceiptField label="Plan" value={payment.subscription?.plan.name ?? "Paid plan"} />
          <ReceiptField label="Payment provider" value={payment.provider} />
          <ReceiptField label="Provider reference" value={payment.providerReference} />
        </div>

        {payment.subscription ? (
          <div className="receipt-note mt-8 rounded-tradia bg-slate-50 p-5">
            <h2 className="text-lg font-black">Subscription period</h2>
            <p className="mt-2 text-sm text-slate-600">
              {payment.subscription.startsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })} to{" "}
              {payment.subscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
            </p>
          </div>
        ) : null}

        <p className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          This receipt confirms payment recorded by Tradia for the listed business subscription. Keep the provider reference for support and reconciliation.
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

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
