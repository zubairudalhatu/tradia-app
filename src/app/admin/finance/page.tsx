import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { createAdminActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateWalletFulfillmentAction } from "../actions";

type FinancePageProps = {
  searchParams: Promise<{ paymentSearch?: string; paymentStatus?: string; walletSearch?: string; walletType?: string }>;
};

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");

  const paymentSearch = params.paymentSearch?.trim();
  const walletSearch = params.walletSearch?.trim();
  const paymentWhere: Prisma.PaymentWhereInput = {
    ...(paymentSearch ? { OR: [
      { providerReference: { contains: paymentSearch, mode: "insensitive" } },
      { provider: { contains: paymentSearch, mode: "insensitive" } },
      { user: { name: { contains: paymentSearch, mode: "insensitive" } } },
      { user: { email: { contains: paymentSearch, mode: "insensitive" } } },
      { business: { name: { contains: paymentSearch, mode: "insensitive" } } }
    ] } : {}),
    ...(isPaymentStatus(params.paymentStatus) ? { status: params.paymentStatus } : {})
  };
  const walletWhere: Prisma.WalletTransactionWhereInput = {
    ...(walletSearch ? { OR: [
      { reference: { contains: walletSearch, mode: "insensitive" } },
      { description: { contains: walletSearch, mode: "insensitive" } },
      { user: { name: { contains: walletSearch, mode: "insensitive" } } },
      { user: { email: { contains: walletSearch, mode: "insensitive" } } },
      { business: { name: { contains: walletSearch, mode: "insensitive" } } }
    ] } : {}),
    ...(isWalletType(params.walletType) ? { type: params.walletType } : {})
  };
  const [payments, walletTransactions, successfulRevenue, walletCredits, openWalletSpends] = await Promise.all([
    prisma.payment.findMany({
      where: paymentWhere,
      include: { user: true, business: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      take: paymentSearch || params.paymentStatus ? 50 : 25
    }),
    prisma.walletTransaction.findMany({
      where: walletWhere,
      include: { user: true, business: true, payment: true },
      orderBy: { createdAt: "desc" },
      take: walletSearch || params.walletType ? 50 : 25
    }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true }, _count: true }),
    prisma.walletTransaction.aggregate({ where: { type: "CREDIT" }, _sum: { amount: true } }),
    prisma.walletTransaction.count({ where: { type: "DEBIT", NOT: { metadata: { path: ["fulfillmentStatus"], equals: "FULFILLED" } } } })
  ]);
  const token = createAdminActionToken(user);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-extrabold uppercase text-ember">Admin finance</p>
      <h1 className="mt-1 text-4xl font-black text-ink">Payments and wallet operations</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric value={formatAmount(successfulRevenue._sum.amount ?? 0, "NGN")} label={`${successfulRevenue._count} successful payments`} />
        <Metric value={formatAmount(walletCredits._sum.amount ?? 0, "NGN")} label="Wallet top-ups recorded" />
        <Metric value={String(openWalletSpends)} label="Open wallet fulfillment items" />
      </div>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Payment history</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/admin/finance">
            <input className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="paymentSearch" defaultValue={params.paymentSearch ?? ""} placeholder="Search customer, business, provider, reference" />
            <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="paymentStatus" defaultValue={params.paymentStatus ?? ""}>
              <option value="">All statuses</option><option value="PENDING">Pending</option><option value="SUCCESS">Success</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option>
            </select>
            <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white">Filter</button>
          </form>
        </div>
        <div className="divide-y divide-slate-200">
          {payments.length ? payments.map((payment) => (
            <article key={payment.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-black">{payment.business?.name ?? "Account payment"} - {formatAmount(payment.amount, payment.currency)}</h3>
                <p className="text-sm text-slate-600">{payment.subscription?.plan.name ?? "No plan"} - {payment.provider} - {payment.status}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.user.name} - {payment.user.email} - {payment.providerReference}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-sm font-bold text-slate-500">{(payment.paidAt ?? payment.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time>
                {payment.status === "SUCCESS" ? <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/admin/payments/${payment.id}/receipt?adminActionToken=${encodeURIComponent(token)}`}>Receipt</a> : null}
              </div>
            </article>
          )) : <p className="p-5 text-sm text-slate-600">No matching payments.</p>}
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Wallet transactions and fulfillment</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/admin/finance">
            <input className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="walletSearch" defaultValue={params.walletSearch ?? ""} placeholder="Search customer, business, add-on, reference" />
            <select className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="walletType" defaultValue={params.walletType ?? ""}>
              <option value="">All wallet activity</option><option value="CREDIT">Top-ups</option><option value="DEBIT">Add-on spends</option>
            </select>
            <button className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white">Filter</button>
          </form>
        </div>
        <div className="divide-y divide-slate-200">
          {walletTransactions.length ? walletTransactions.map((transaction) => {
            const metadata = jsonObject(transaction.metadata);
            const isSpend = transaction.type === "DEBIT";
            const isFulfilled = metadata.fulfillmentStatus === "FULFILLED";
            const note = typeof metadata.fulfillmentNote === "string" ? metadata.fulfillmentNote : "";
            return (
              <article key={transaction.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-black">{typeof metadata.productName === "string" ? metadata.productName : transaction.description}</h3>
                  <p className="mt-1 text-sm text-slate-600">{transaction.user.name} - {transaction.business?.name ?? "Account wallet"}</p>
                  <p className="mt-1 text-xs text-slate-500">{transaction.reference}</p>
                </div>
                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  <strong className={transaction.type === "CREDIT" ? "text-forest" : "text-ember"}>{transaction.type === "CREDIT" ? "+" : "-"}{formatAmount(transaction.amount, transaction.currency)}</strong>
                  <a className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/admin/wallet/${transaction.id}/receipt?adminActionToken=${encodeURIComponent(token)}`}>Receipt</a>
                  {isSpend ? (
                    <form action={updateWalletFulfillmentAction} className="grid gap-2 sm:min-w-56">
                      <input type="hidden" name="adminActionToken" value={token} />
                      <input type="hidden" name="walletTransactionId" value={transaction.id} />
                      <input type="hidden" name="fulfillmentStatus" value={isFulfilled ? "OPEN" : "FULFILLED"} />
                      <textarea className="min-h-16 rounded-tradia border border-slate-200 px-3 py-2 text-xs" name="fulfillmentNote" defaultValue={note} placeholder="Fulfillment note" />
                      <button className={`rounded-tradia px-3 py-2 text-xs font-black ${isFulfilled ? "bg-slate-100 text-ink" : "bg-forest text-white"}`}>{isFulfilled ? "Reopen" : "Mark fulfilled"}</button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          }) : <p className="p-5 text-sm text-slate-600">No matching wallet activity.</p>}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <article className="rounded-tradia border border-slate-200 bg-white p-5 shadow-sm"><strong className="block text-2xl font-black text-ink">{value}</strong><span className="text-sm font-bold text-slate-500">{label}</span></article>;
}
function formatAmount(amount: number, currency: string) { return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
function isPaymentStatus(value?: string): value is "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" { return ["PENDING", "SUCCESS", "FAILED", "REFUNDED"].includes(value ?? ""); }
function isWalletType(value?: string): value is "CREDIT" | "DEBIT" { return ["CREDIT", "DEBIT"].includes(value ?? ""); }
function jsonObject(value: Prisma.JsonValue | null) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
