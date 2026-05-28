import Link from "next/link";
import { requestPasswordResetAction } from "./actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-4xl font-black tracking-normal">Reset your password</h1>
      <p className="mt-4 text-slate-600">
        Enter your account email and we will send a secure reset link if the account exists.
      </p>
      {params.sent ? (
        <p className="mt-4 rounded-tradia border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-forest">
          If that email exists, a reset link has been sent.
        </p>
      ) : null}
      <form action={requestPasswordResetAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="email" type="email" required />
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Send Reset Link</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Remembered it? <Link className="font-bold text-forest" href="/login">Sign in</Link>
      </p>
    </main>
  );
}
