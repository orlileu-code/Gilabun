/**
 * GET /api/reviews — returns all reviews (public, for landing page).
 */

import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const reviews = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt;
      return {
        id: d.id,
        ...data,
        createdAt: ts?.toMillis?.() ?? null,
      };
    });
    return NextResponse.json({ reviews });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
