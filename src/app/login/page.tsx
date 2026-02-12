"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/firebase/auth-client";

type ErrorResponse = {
  error: string;
  details?: string;
  suggestion?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  async function handleGoogleSignIn() {
    setError(null);
    setErrorDetails(null);
    setErrorSuggestion(null);
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data: ErrorResponse = await res.json().catch(() => ({}));
        setError(data.error || "Sign in failed");
        if (data.details) {
          setErrorDetails(data.details);
        }
        if (data.suggestion) {
          setErrorSuggestion(data.suggestion);
        }
        return;
      }
      router.push("/app");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setError(message);
      setErrorDetails("An unexpected error occurred during sign-in.");
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
            <p className="text-sm font-medium text-red-800">{error}</p>
            {errorDetails && (
              <p className="text-xs text-red-700">{errorDetails}</p>
            )}
            {errorSuggestion && (
              <p className="text-xs text-red-600 mt-2">
                <strong>Fix:</strong> {errorSuggestion}
              </p>
            )}
            {isDevelopment && (
              <p className="text-xs text-red-600 mt-2">
                <Link
                  href="/api/auth/debug"
                  target="_blank"
                  className="underline hover:no-underline"
                >
                  View configuration diagnostics →
                </Link>
              </p>
            )}
          </div>
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
