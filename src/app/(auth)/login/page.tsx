import Link from "next/link";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-4xl font-black tracking-normal">Sign in to Tradia</h1>
      {params.error ? (
        <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          Invalid login details or inactive account.
        </p>
      ) : null}
      <form action={loginAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="email" type="email" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Password
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="password" type="password" required />
        </label>
        {isSafeNextPath(params.next) ? <input type="hidden" name="next" value={params.next} /> : null}
        <Link className="text-sm font-bold text-forest" href="/forgot-password">
          Forgot password?
        </Link>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Sign In</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        New to Tradia? <Link className="font-bold text-forest" href="/register">Create an account</Link>
      </p>
    </main>
  );
}

function isSafeNextPath(value?: string) {
  return Boolean(value?.startsWith("/") && !value.startsWith("//"));
}
