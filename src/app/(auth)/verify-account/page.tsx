import { redirect } from "next/navigation";
import { isUserAccountVerified } from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { confirmAccountVerificationCodeAction, sendAccountVerificationCodeAction } from "./actions";

type VerifyAccountPageProps = {
  searchParams: Promise<{ sent?: string; error?: string; delivery?: string; method?: string }>;
};

export const dynamic = "force-dynamic";

export default async function VerifyAccountPage({ searchParams }: VerifyAccountPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login?next=/verify-account");
  if (isUserAccountVerified(user)) redirect("/dashboard");

  const canUsePhone = Boolean(user.phone);
  const selectedMethod = normalizeMethodLabel(params.method ?? params.sent);

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account verification</p>
      <h1 className="text-4xl font-black tracking-normal">Verify your Tradia account</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Choose one verification channel. Email verifies your email address. SMS or WhatsApp verifies your phone number.
      </p>

      {params.sent ? (
        <p className="mt-5 rounded-tradia border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-forest">
          Verification code sent by {normalizeMethodLabel(params.sent)}.
          {params.delivery === "skipped" ? " Delivery provider is not configured yet, so sending was skipped." : ""}
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-5 rounded-tradia border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage(params.error)}
        </p>
      ) : null}

      <section className="mt-8 grid gap-5 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black">Send a code</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Codes expire after 15 minutes. Requesting a new code replaces the previous one.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SendCodeForm method="EMAIL" label="Email" destination={user.email} />
          <SendCodeForm method="SMS" label="SMS" destination={user.phone} disabled={!canUsePhone} />
          <SendCodeForm method="WHATSAPP" label="WhatsApp" destination={user.phone} disabled={!canUsePhone} />
        </div>
        {!canUsePhone ? (
          <p className="rounded-tradia bg-slate-50 p-3 text-sm font-semibold text-slate-600">
            Add a phone number on your account later to verify by SMS or WhatsApp.
          </p>
        ) : null}
      </section>

      <form action={confirmAccountVerificationCodeAction} className="mt-6 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Enter verification code</h2>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Code received by
          <select className="rounded-tradia border border-slate-200 px-4 py-3" name="method" defaultValue={selectedMethod}>
            <option value="EMAIL">Email</option>
            <option value="SMS" disabled={!canUsePhone}>SMS</option>
            <option value="WHATSAPP" disabled={!canUsePhone}>WhatsApp</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          6-digit code
          <input
            className="rounded-tradia border border-slate-200 px-4 py-3 text-lg font-black tracking-[0.2em]"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Verify Account</button>
      </form>
    </main>
  );
}

function SendCodeForm({
  method,
  label,
  destination,
  disabled = false
}: {
  method: "EMAIL" | "SMS" | "WHATSAPP";
  label: string;
  destination?: string | null;
  disabled?: boolean;
}) {
  return (
    <form action={sendAccountVerificationCodeAction} className="grid gap-2 rounded-tradia border border-slate-200 p-4">
      <input type="hidden" name="method" value={method} />
      <strong className="text-ink">{label}</strong>
      <span className="min-h-10 text-sm leading-5 text-slate-600">{destination ?? "No phone number added"}</span>
      <button
        className="rounded-tradia bg-slate-100 px-4 py-2 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
      >
        Send Code
      </button>
    </form>
  );
}

function normalizeMethodLabel(value?: string) {
  const method = String(value ?? "EMAIL").toUpperCase();
  if (method === "SMS") return "SMS";
  if (method === "WHATSAPP") return "WHATSAPP";
  return "EMAIL";
}

function errorMessage(error: string) {
  if (error === "missing-destination") return "That verification method needs a phone number on your account.";
  if (error === "already-verified") return "That account channel is already verified.";
  if (error === "delivery-failed") return "We could not send that verification code. Please try email or contact support.";
  if (error === "expired") return "That code has expired. Please request a new one.";
  return "That verification code is invalid. Please check it and try again.";
}
