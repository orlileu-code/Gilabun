/**
 * Returns the current user profile if authenticated.
 */

import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getUserIdFromSession } from "@/lib/firebase/auth-server";
import { getAdminApp } from "@/lib/firebase/admin";

export async function GET() {
  const uid = await getUserIdFromSession();
  if (!uid) {
    return NextResponse.json({ user: null });
  }
  try {
    const auth = getAuth(getAdminApp());
    const user = await auth.getUser(uid);
    return NextResponse.json({
      user: {
        userId: user.uid,
        displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
        email: user.email ?? null,
        photoURL: user.photoURL ?? null,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
