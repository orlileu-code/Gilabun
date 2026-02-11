import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-16 py-12">
      {/* Hero */}
      <section className="max-w-3xl text-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs meta-text text-[var(--muted)] mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-action)]" />
          <span>Designed for busy hosts &amp; floor managers</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text)]">
          TableFlow keeps your{" "}
          <span style={{ color: "var(--primary-action)" }}>floor &amp; waitlist</span>{" "}
          in perfect sync.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--muted)] leading-relaxed">
          A visual floor map, live waitlist, and smart seating suggestions in one dashboard.
          Built for restaurants that want smoother service, fewer walk‑outs, and happier guests.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/app" className="btn-primary px-6 py-2.5 text-base">
            Log in to TableFlow
          </Link>
          <Link
            href="/app"
            className="btn-outline text-sm px-4 py-2 meta-text"
          >
            Try live demo workspace
          </Link>
        </div>
        <p className="mt-3 text-xs meta-text text-[var(--muted)]">
          No installation on the floor. Just open your browser and start seating.
        </p>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">
              Live floor map
            </h2>
            <p className="meta-text text-[var(--muted)]">
              Drag‑and‑drop builder matches your real floor.
              Every table state is synced to a clean, zoom‑to‑fit service view.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">
              Smart waitlist &amp; timing
            </h2>
            <p className="meta-text text-[var(--muted)]">
              Track parties, quoted times, and table turn estimates in one place.
              See who&apos;s next and which table frees up first.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">
              One source of truth
            </h2>
            <p className="meta-text text-[var(--muted)]">
              Powered by Firebase and server‑side actions.
              The hostess stand, managers, and bar all see the same real‑time picture.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="w-full max-w-5xl px-4">
        <h2 className="text-2xl font-semibold text-center text-[var(--text)] mb-8">
          What hosts are saying
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500 text-sm">★</span>
              ))}
            </div>
            <p className="meta-text text-[var(--muted)] mb-3 italic">
              &quot;Finally, a tool that shows me exactly which tables are free and who&apos;s waiting. No more guessing or running back and forth.&quot;
            </p>
            <p className="text-xs font-medium text-[var(--text)]">
              — Sarah M., Hostess
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500 text-sm">★</span>
              ))}
            </div>
            <p className="meta-text text-[var(--muted)] mb-3 italic">
              &quot;The drag-and-drop seating is a game changer. I can seat parties in seconds and everyone on the floor sees it instantly.&quot;
            </p>
            <p className="text-xs font-medium text-[var(--text)]">
              — Marcus T., Floor Manager
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500 text-sm">★</span>
              ))}
            </div>
            <p className="meta-text text-[var(--muted)] mb-3 italic">
              &quot;We&apos;ve cut wait times by 20% and walk-outs are way down. The visual floor map makes everything so much clearer.&quot;
            </p>
            <p className="text-xs font-medium text-[var(--text)]">
              — Jessica L., Restaurant Owner
            </p>
          </div>
        </div>
      </section>

      {/* Personal Story */}
      <section className="w-full max-w-4xl px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 md:p-10" style={{ boxShadow: "var(--shadow)" }}>
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">
            Why I built TableFlow
          </h2>
          <div className="space-y-4 text-[var(--muted)] leading-relaxed">
            <p>
              After years working in restaurants, I saw the same problem everywhere: hosts juggling paper waitlists, managers guessing at table availability, and guests waiting longer than they should. The tools that existed were either too expensive, too complicated, or didn&apos;t match how restaurants actually work.
            </p>
            <p>
              TableFlow started as a simple idea: what if the hostess stand had a visual floor map that showed exactly which tables were free, occupied, or turning? What if the waitlist could automatically suggest the best table for the next party? What if everyone—hosts, managers, servers—could see the same real-time picture?
            </p>
            <p>
              I built TableFlow to be the tool I wish I had when I was managing the floor. It&apos;s designed for speed: drag a party onto a table to seat them, mark tables as turning with one click, see who&apos;s next in line at a glance. No training required, no expensive hardware—just open it in a browser and start using it.
            </p>
            <p className="font-medium text-[var(--text)]">
              If you&apos;re running a busy restaurant and want smoother service, fewer walk-outs, and happier guests, TableFlow can help. Try it tonight and see the difference it makes.
            </p>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="w-full max-w-3xl px-4 border border-[var(--border)] bg-[var(--panel)] rounded-2xl py-6 text-center" style={{ boxShadow: "var(--shadow)" }}>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          Ready to streamline tonight&apos;s service?
        </h2>
        <p className="meta-text text-[var(--muted)] mb-4">
          Use TableFlow as your digital seating chart and waitlist.
          Start with a demo workspace, then customize the floor to match your restaurant.
        </p>
        <Link href="/app" className="btn-primary px-6 py-2.5 text-base">
          Open TableFlow dashboard
        </Link>
      </section>
    </main>
  );
}

