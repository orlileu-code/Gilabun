/**
 * Server-side auth: session cookie verification and user ID resolution.
 * Each signed-in user gets their own Firestore path: /users/{uid}/
 */

import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { getAdminApp } from "./admin";

const SESSION_COOKIE_NAME = "session";

/** Get Firebase Auth instance. */
function getFirebaseAuth() {
  return getAuth(getAdminApp());
}

/**
 * Verify the session cookie and return the user's uid.
 * Returns null if no session or invalid.
 */
export async function getUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decoded = await getFirebaseAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Get the current user ID from the session cookie.
 * Returns null when unauthenticated – each user gets their own data.
 */
export async function getUserId(): Promise<string | null> {
  return getUserIdFromSession();
}

/** Require auth – returns uid or throws (redirect handled by caller). */
export async function requireUserId(): Promise<string> {
  const uid = await getUserId();
  if (!uid) {
    throw new Error("UNAUTHENTICATED");
  }
  return uid;
}
