import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import { addDays } from "@/lib/time";
import { getWalletBalance, listWalletOrders, listWalletTransactions } from "@/lib/wallet/ledger";
import { formatNaira, walletProducts } from "@/lib/wallet/products";
import { spendWalletProductAction, startWalletTopUpAction, updateAccountAction } from "./actions";

type AccountPageProps = {
  searchParams: Promise<{ error?: string; saved?: string; wallet?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login?next=/account");

  const [businesses, payments, walletState] = await Promise.all([
    prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        plan: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { endsAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      include: {
        business: true,
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    getAccountWalletState(user.id)
  ]);
  const renewalWindowEndsAt = addDays(new Date(), 30);
  const publishedBusinesses = businesses.filter((business) => business.listingStatus === "PUBLISHED");
  const walletBalance = walletState.balance;
  const walletTransactions = walletState.transactions;
  const walletOrders = walletState.orders;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-5xl font-black tracking-normal">Your profile</h1>
      <p className="mt-4 text-lg text-slate-600">
        Keep your display name, phone number, and contact details current so Tradia can connect listings, reviews, and verification activity to the right person.
      </p>

      {params.saved ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Profile updated.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {params.error === "phone" ? "That phone number is already used by another account." : "Please enter a valid name."}
        </p>
      ) : null}
      {params.wallet ? (
        <p className={`mt-5 rounded-tradia border p-4 text-sm font-bold ${
          params.wallet === "spent"
            ? "border-emerald-200 bg-emerald-50 text-forest"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {walletMessage(params.wallet)}
        </p>
      ) : null}

      <form action={updateAccountAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Display name / username
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={user.name} required minLength={2} />
          <span className="text-xs font-semibold text-slate-500">
            This is the name shown on your account, reviews, and business activity.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 bg-slate-50 px-4 py-3" value={user.email} disabled />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" defaultValue={user.phone ?? ""} placeholder="+234..." />
        </label>
        <div className="rounded-tradia bg-slate-50 p-4 text-sm text-slate-600">
          <strong className="text-ink">Account role:</strong> {user.role.replace("_", " ")}
        </div>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Save Profile</button>
      </form>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm font-extrabold uppercase text-ember">Wallet</p>
          <h2 className="mt-1 text-2xl font-black">Tradia wallet</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Fund your wallet once, then use the balance for launch add-ons such as homepage featuring, Business Starter Kit, and Verified Business Kit.
          </p>
          {walletState.unavailable ? (
            <p className="mt-3 rounded-tradia border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
              Wallet setup is pending. Existing account tools remain available while the wallet database is prepared.
            </p>
          ) : null}
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-tradia border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black uppercase text-slate-500">Available balance</p>
            <strong className="mt-2 block text-4xl font-black text-forest">{formatNaira(walletBalance)}</strong>
            <form action={startWalletTopUpAction} className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-bold text-slate-600">
                Add money
                <input
                  className="rounded-tradia border border-slate-200 px-4 py-3"
                  name="amount"
                  type="number"
                  min={1000}
                  max={500000}
                  step={500}
                  defaultValue={10000}
                  required
                />
              </label>
              <button
                name="paymentProvider"
                value="squad"
                disabled={walletState.unavailable}
                className="rounded-tradia bg-forest px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {walletState.unavailable ? "Wallet setup pending" : "Fund with Squad"}
              </button>
            </form>
          </div>
          <div className="grid gap-4">
            {walletProducts.map((product) => (
              <article key={product.code} className="rounded-tradia border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <h3 className="text-lg font-black">{product.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>
                    <p className="mt-2 text-xl font-black text-forest">{formatNaira(product.price)}</p>
                    <ul className="mt-3 grid gap-1 text-sm text-slate-600">
                      {product.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  {publishedBusinesses.length ? (
                    <form action={spendWalletProductAction} className="grid gap-2 md:min-w-56">
                      <input type="hidden" name="productCode" value={product.code} />
                      <select className="rounded-tradia border border-slate-200 px-3 py-2 text-sm" name="businessId" required>
                        {publishedBusinesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.name}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={walletState.unavailable}
                        className="rounded-tradia bg-slate-100 px-3 py-2 text-sm font-black text-ink disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {walletState.unavailable ? "Wallet setup pending" : "Pay from wallet"}
                      </button>
                    </form>
                  ) : (
                    <Link className="rounded-tradia bg-slate-100 px-3 py-2 text-sm font-black text-ink" href="/businesses/new">
                      Add published business
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 p-5">
          <h3 className="text-lg font-black">Add-on orders</h3>
          <div className="mt-3 divide-y divide-slate-200 rounded-tradia border border-slate-200">
            {walletOrders.length ? walletOrders.map((order) => {
              const metadata = walletMetadata(order.metadata);
              const status = walletFulfillmentStatus(order.metadata);
              const productCode = metadataString(metadata, "productCode");
              const fulfillmentNote = metadataString(metadata, "fulfillmentNote");

              return (
                <article key={order.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black">{walletProductName(order.description, metadata)}</h4>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        status === "FULFILLED" ? "bg-emerald-50 text-forest" : "bg-slate-100 text-slate-600"
                      }`}>
                        {status === "FULFILLED" ? "Fulfilled" : "Open"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.business?.name ?? "Account wallet"} - {order.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {productCode ? productCode.replaceAll("_", " ") : order.reference} - Ref: {order.reference}
                    </p>
                    {fulfillmentNote ? (
                      <p className="mt-2 rounded-tradia bg-slate-50 p-3 text-sm font-bold text-slate-600">
                        Note: {fulfillmentNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm font-black text-ember">-{formatNaira(order.amount)}</span>
                    <Link className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/account/wallet/${order.id}/receipt`}>
                      Receipt
                    </Link>
                  </div>
                </article>
              );
            }) : (
              <p className="p-4 text-sm text-slate-600">No add-on orders yet.</p>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 p-5">
          <h3 className="text-lg font-black">Wallet history</h3>
          <div className="mt-3 divide-y divide-slate-200 rounded-tradia border border-slate-200">
            {walletTransactions.length ? walletTransactions.map((transaction) => (
              <article key={transaction.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h4 className="font-black">{transaction.description}</h4>
                  <p className="text-sm text-slate-600">
                    {transaction.business?.name ?? "Account wallet"} - {transaction.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Ref: {transaction.reference}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`text-sm font-black ${transaction.type === "CREDIT" ? "text-forest" : "text-ember"}`}>
                    {transaction.type === "CREDIT" ? "+" : "-"}{formatNaira(transaction.amount)}
                  </span>
                  <Link className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/account/wallet/${transaction.id}/receipt`}>
                    Receipt
                  </Link>
                </div>
              </article>
            )) : (
              <p className="p-4 text-sm text-slate-600">No wallet activity yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Plan and renewal status</h2>
          <p className="mt-1 text-sm text-slate-600">Track paid plan access for each business you manage.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {businesses.length ? businesses.map((business) => {
            const planState = getBusinessPlanState(business);
            const activeSubscription = planState.activeSubscription;
            const expiresSoon = Boolean(activeSubscription && activeSubscription.endsAt <= renewalWindowEndsAt);

            return (
              <article key={business.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-black">{business.name}</h3>
                  <p className="text-sm text-slate-600">
                    {planState.benefits.name} plan
                    {activeSubscription ? ` - active until ${activeSubscription.endsAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}` : ""}
                  </p>
                  {expiresSoon ? (
                    <p className="mt-2 text-sm font-bold text-amber-800">This plan is due for renewal soon.</p>
                  ) : null}
                  {planState.isExpired ? (
                    <p className="mt-2 text-sm font-bold text-red-700">This paid plan has expired. Free plan benefits now apply.</p>
                  ) : null}
                </div>
                <Link className="rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white" href="/pricing">
                  View Plans
                </Link>
              </article>
            );
          }) : (
            <p className="p-5 text-sm text-slate-600">No businesses are attached to this account yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-tradia border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black">Payment history</h2>
          <p className="mt-1 text-sm text-slate-600">Recent subscription payments connected to this account.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {payments.length ? payments.map((payment) => (
            <article key={payment.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-black">
                  {payment.subscription?.plan.name ?? "Plan payment"} - {formatAmount(payment.amount, payment.currency)}
                </h3>
                <p className="text-sm text-slate-600">
                  {payment.business?.name ?? "Business"} - {payment.provider} - {payment.status}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Reference: {payment.providerReference} - {payment.paidAt ? payment.paidAt.toLocaleDateString("en-NG", { dateStyle: "medium" }) : payment.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${payment.status === "SUCCESS" ? "bg-emerald-50 text-forest" : "bg-slate-100 text-ink"}`}>
                  {payment.status}
                </span>
                {payment.status === "SUCCESS" ? (
                  <Link className="rounded-tradia bg-slate-100 px-3 py-2 text-xs font-black text-ink" href={`/account/payments/${payment.id}/receipt`}>
                    Receipt
                  </Link>
                ) : null}
              </div>
            </article>
          )) : (
            <p className="p-5 text-sm text-slate-600">No payments have been recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

async function getAccountWalletState(userId: string) {
  try {
    const [balance, transactions, orders] = await Promise.all([
      getWalletBalance(userId),
      listWalletTransactions(userId),
      listWalletOrders(userId)
    ]);

    return {
      balance,
      transactions,
      orders,
      unavailable: false
    };
  } catch (error) {
    console.error("Wallet state could not be loaded", error);

    return {
      balance: 0,
      transactions: [],
      orders: [],
      unavailable: true
    };
  }
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

function walletProductName(description: string, metadata: Record<string, unknown>) {
  return metadataString(metadata, "productName") || description;
}

function walletFulfillmentStatus(value: unknown) {
  const status = metadataString(walletMetadata(value), "fulfillmentStatus");
  return status === "FULFILLED" ? "FULFILLED" : "OPEN";
}

function walletMessage(status: string) {
  if (status === "spent") return "Wallet payment successful. The selected add-on has been recorded.";
  if (status === "setup-required") return "Wallet setup is still pending. Please try again after the wallet database is prepared.";
  if (status === "topup-invalid") return "Enter a wallet top-up between NGN 1,000 and NGN 500,000.";
  if (status === "topup-failed") return "Wallet top-up could not be started. Please try again.";
  if (status === "low-balance") return "Your wallet balance is too low for that add-on.";
  if (status === "requires-verified") return "The Verified Business Kit is available only for verified businesses.";
  if (status === "already-featured") return "That business is already featured on the homepage.";
  if (status === "requires-feature-plan") return "Homepage featuring requires a Gold or Platinum business plan first.";
  if (status === "spend-invalid") return "Wallet payment could not be completed for that add-on.";
  if (status.endsWith("not-configured")) return "Wallet checkout is not configured for this payment provider yet.";
  if (status.endsWith("provider-error")) return "The payment provider rejected the wallet top-up request.";

  return "Wallet action could not be completed.";
}
