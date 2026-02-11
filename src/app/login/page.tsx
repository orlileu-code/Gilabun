"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/firebase/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sign in failed");
      }
      router.push("/app");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold text-[var(--text)]">
          Sign in to TableFlow
        </h1>
        <p className="text-center text-sm text-[var(--muted)]">
          Your templates and workspaces are private to your account.
        </p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && (
          <p className="text-center text-sm text-[var(--red)]">{error}</p>
        )}
        <p className="text-center text-xs text-[var(--muted)]">
          <Link href="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
