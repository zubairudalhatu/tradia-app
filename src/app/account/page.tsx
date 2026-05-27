import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { updateAccountAction } from "./actions";

type AccountPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) redirect("/login?next=/account");

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="mb-2 text-sm font-extrabold uppercase text-ember">Account</p>
      <h1 className="text-5xl font-black tracking-normal">Your profile</h1>
      <p className="mt-4 text-lg text-slate-600">
        Keep your contact details current so Tradia can connect listings, reviews, and verification activity to the right person.
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

      <form action={updateAccountAction} className="mt-8 grid gap-4 rounded-tradia border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Full name
          <input className="rounded-tradia border border-slate-200 px-4 py-3" name="name" defaultValue={user.name} required />
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
    </main>
  );
}
