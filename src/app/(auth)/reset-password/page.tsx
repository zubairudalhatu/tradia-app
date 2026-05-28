import Link from "next/link";
import { resetPasswordAction } from "./actions";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string; token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-4xl font-black tracking-normal">Choose a new password</h1>
      {params.error ? (
        <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {params.error === "expired" ? "This reset link is invalid or has expired." : "Use matching passwords of at least 8 characters."}
        </p>
      ) : null}
      {params.token ? (
        <form action={resetPasswordAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="token" value={params.token} />
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            New password
            <input className="rounded-tradia border border-slate-200 px-4 py-3" name="password" type="password" minLength={8} required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Confirm password
            <input className="rounded-tradia border border-slate-200 px-4 py-3" name="confirmPassword" type="password" minLength={8} required />
          </label>
          <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Reset Password</button>
        </form>
      ) : (
        <div className="mt-8 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Request a fresh reset link to continue.</p>
          <Link className="mt-4 inline-flex rounded-tradia bg-forest px-5 py-3 font-bold text-white" href="/forgot-password">
            Request Reset Link
          </Link>
        </div>
      )}
    </main>
  );
}
