import type { Metadata } from "next";
import Link from "next/link";
import { registerAction } from "./actions";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata: Metadata = {
  title: "Create a Tradia Account",
  description: "Create a Tradia account to list a Nigerian business, verify your account, manage profile media, receive enquiries, and request business verification.",
  robots: {
    index: false,
    follow: true
  }
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">Create your Tradia account</h1>
      {error ? (
        <p className="mt-4 rounded-tradia border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          Please check your details. Email or phone may already exist.
        </p>
      ) : null}
      <form action={registerAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <p className="rounded-tradia bg-emerald-50 p-3 text-sm font-bold text-forest">
          After signup, verify your account by email, SMS, or WhatsApp before creating a listing.
        </p>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Full name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Email
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="email" type="email" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Phone
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="phone" type="tel" placeholder="07067686190" required />
          <span className="text-xs font-semibold text-slate-500">Enter a Nigerian number. Tradia converts it securely to international format.</span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Password
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="password" type="password" minLength={8} required />
        </label>
        <button className="rounded-tradia bg-forest px-5 py-3 font-bold text-white">Create Account</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Already have an account? <Link className="font-bold text-forest" href="/login">Sign in</Link>
      </p>
    </main>
  );
}
