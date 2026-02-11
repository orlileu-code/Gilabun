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
    const decoded = await auth.verifyIdToken(idToken);
    // Optional: require recent sign-in (auth_time within 5 min)
    const authTime = decoded.auth_time;
    if (authTime && Date.now() / 1000 - authTime > 5 * 60) {
      return NextResponse.json(
        { error: "Recent sign-in required" },
        { status: 401 }
      );
    }
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
    return NextResponse.json(
      { error: "Failed to create session" },
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
