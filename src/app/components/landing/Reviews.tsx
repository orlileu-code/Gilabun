"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { createReview } from "@/app/actions/reviewActions";

type Review = {
  id: string;
  stars?: number;
  quote?: string;
  author?: string;
  role?: string;
  // API shape
  rating?: number;
  comment?: string;
  userName?: string;
  userAvatarUrl?: string | null;
};

const staticReviews: Review[] = [
  {
    id: "s1",
    stars: 5,
    quote:
      "Finally, a tool that shows me exactly which tables are free and who's waiting. No more guessing or running back and forth.",
    author: "Sarah M.",
    role: "Hostess",
  },
  {
    id: "s2",
    stars: 5,
    quote:
      "The drag-and-drop seating is a game changer. I can seat parties in seconds and everyone on the floor sees it instantly.",
    author: "Marcus T.",
    role: "Floor Manager",
  },
  {
    id: "s3",
    stars: 5,
    quote:
      "We've cut wait times by 20% and walk-outs are way down. The visual floor map makes everything so much clearer.",
    author: "Jessica L.",
    role: "Restaurant Owner",
  },
];

function normalizeReview(r: Review): { stars: number; quote: string; author: string; role: string } {
  const stars = r.stars ?? r.rating ?? 5;
  const quote = r.quote ?? r.comment ?? "";
  const author = r.author ?? r.userName ?? "Anonymous";
  const role = r.role ?? "User";
  return { stars, quote, author, role };
}

export function Reviews() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [reviews, setReviews] = useState<Review[]>(staticReviews);
  const [user, setUser] = useState<{ displayName: string; photoURL: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [reviewsRes, meRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/auth/me"),
        ]);
        const reviewsData = await reviewsRes.json();
        const meData = await meRes.json();
        if (reviewsData.reviews?.length) {
          const combined = [...reviewsData.reviews, ...staticReviews].slice(0, 20);
          setReviews(combined);
        }
        if (meData.user) {
          setUser({
            displayName: meData.user.displayName,
            photoURL: meData.user.photoURL ?? null,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await createReview(formRating, formComment);
    setSubmitting(false);
    if (res.ok) {
      setFormSuccess(true);
      setFormComment("");
      const r = await fetch("/api/reviews");
      const data = await r.json();
      if (data.reviews?.length) {
        setReviews([...data.reviews, ...staticReviews].slice(0, 20));
      }
    } else {
      setFormError(res.error);
    }
  }

  return (
    <section id="reviews" ref={ref} className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-4">
            What hosts are saying
          </h2>
          <p className="text-brown-600 max-w-2xl mx-auto">
            Real feedback from restaurants using TableFlow to streamline their service.
          </p>
        </motion.div>

        {/* Add review form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-12 max-w-xl mx-auto"
        >
          {user ? (
            <form onSubmit={handleSubmit} className="rounded-xl border border-brown-200 bg-brown-50/50 p-6">
              <h3 className="text-lg font-semibold text-brown-900 mb-4">Leave a review</h3>
              <div className="flex items-center gap-2 mb-4">
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-brown-700">{user.displayName}</span>
              </div>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormRating(n)}
                    className="text-2xl focus:outline-none"
                    aria-label={`${n} stars`}
                  >
                    <span
                      className={
                        n <= formRating ? "text-brown-600" : "text-brown-300"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full rounded-lg border border-brown-200 bg-white px-3 py-2 text-brown-900 placeholder:text-brown-400 focus:border-brown-400 focus:outline-none focus:ring-1 focus:ring-brown-400"
                required
                minLength={10}
              />
              {formError && (
                <p className="mt-2 text-sm text-red-600">{formError}</p>
              )}
              {formSuccess && (
                <p className="mt-2 text-sm text-green-600">Thanks for your review!</p>
              )}
              <button
                type="submit"
                disabled={submitting || formComment.trim().length < 10}
                className="mt-4 px-4 py-2 rounded-lg bg-brown-700 text-white font-medium hover:bg-brown-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-brown-200 bg-brown-50/50 p-6 text-center">
              <p className="text-brown-700 mb-4">Sign in to leave a review</p>
              <Link
                href="/login"
                className="inline-flex px-4 py-2 rounded-lg bg-brown-700 text-white font-medium hover:bg-brown-800"
              >
                Sign in
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {(loading ? staticReviews : reviews).map((review, index) => {
            const { stars, quote, author, role } = normalizeReview(review);
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="rounded-xl border border-brown-200 bg-white p-6 hover:border-brown-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(stars)].map((_, i) => (
                    <span key={i} className="text-brown-600 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-brown-700 mb-4 italic leading-relaxed">
                  &quot;{quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  {review.userAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.userAvatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-brown-900">{author}</p>
                    <p className="text-xs text-brown-500">{role}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
