/**
 * Session API: create session cookie from ID token, or clear session.
 */

import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken?.toString();
    if (!idToken) {
      return NextResponse.json(
        { error: "Missing idToken" },
        { status: 400 }
      );
    }
    const auth = getAuth(getAdminApp());
    await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000
    });
    const res = NextResponse.json({ status: "success" });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return res;
  } catch (e) {
    console.error("[session] Failed to create session:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", details: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ status: "success" });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/"
  });
  return res;
}
