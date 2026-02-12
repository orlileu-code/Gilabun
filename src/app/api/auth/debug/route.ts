/**
 * GET /api/auth/debug — returns config status (no secrets).
 * Use only for debugging "Failed to create session" in development.
 */

import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const hasClientEmail = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectMatch = clientProjectId === adminProjectId;
  return NextResponse.json({
    clientProjectId: clientProjectId ?? "(missing)",
    adminProjectId: adminProjectId ?? "(missing)",
    projectMatch,
    hasClientEmail,
    hasPrivateKey,
    privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length ?? 0,
    suggestion: !projectMatch
      ? "Fix: Set FIREBASE_ADMIN_PROJECT_ID to match NEXT_PUBLIC_FIREBASE_PROJECT_ID"
      : !hasClientEmail || !hasPrivateKey
        ? "Fix: Add FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY from Firebase Console → Project settings → Service accounts"
        : "Config looks ok. If sign-in still fails, check Firebase Console: Auth → Sign-in method → Google enabled, and Authorized domains include localhost",
  });
}
