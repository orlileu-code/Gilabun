"use server";

import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getUserIdFromSession } from "@/lib/firebase/auth-server";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase/admin";

export type CreateReviewResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createReview(
  rating: number,
  comment: string
): Promise<CreateReviewResult> {
  const uid = await getUserIdFromSession();
  if (!uid) {
    return { ok: false, error: "Sign in to leave a review" };
  }
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5" };
  }
  const trimmed = comment.trim();
  if (trimmed.length < 10) {
    return { ok: false, error: "Comment must be at least 10 characters" };
  }

  try {
    const auth = getAuth(getAdminApp());
    const user = await auth.getUser(uid);
    const db = getAdminFirestore();
    await db.collection("reviews").add({
      userId: uid,
      userName: user.displayName ?? user.email?.split("@")[0] ?? "User",
      userEmail: user.email ?? null,
      userAvatarUrl: user.photoURL ?? null,
      rating,
      comment: trimmed,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to submit review" };
  }
}
