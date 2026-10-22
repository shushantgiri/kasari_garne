"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") === "not_admin" ? "This account is not an admin. Ask an owner to add you to the admins table." : "");
  const db = supabaseBrowser();

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="card p-6">
        <h1 className="text-xl font-bold">Admin sign in</h1>
        {!db ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>Supabase is not configured, so there are no accounts. The dashboard opens in read-only demo mode.</p>
            <a className="btn-primary w-full" href="/admin">Open demo dashboard</a>
          </div>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const { error } = await db.auth.signInWithPassword({ email, password });
              setBusy(false);
              if (error) return setError(error.message);
              router.replace(params.get("next") || "/admin");
              router.refresh();
            }}
          >
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-dark">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
