"use client";

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseApp } from "./client";

/** Sign in with Google and return the ID token for session creation. */
export async function signInWithGoogle(): Promise<string> {
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase not configured");
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const token = await result.user.getIdToken(true);
  return token;
}
