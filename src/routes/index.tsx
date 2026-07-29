import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Users, Flame, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minister's Vault — Preserve Knowledge. Build Discipline. Protect Legacy." },
      {
        name: "description",
        content:
          "A cloud library and reading accountability platform for ministers, pastors, and theological students.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-serif text-lg font-semibold tracking-tight">
              Minister's Vault
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
          <p className="mb-5 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-foreground/80">
            For ministers, pastors & theological students
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Preserving Knowledge.
            <br />
            <span className="text-accent">Building Discipline.</span> Protecting Legacy.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Catalog your ministry library, track every book you lend so it comes home, and
            build a consistent reading rhythm — all in one quiet, well-kept study.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start your vault
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "A catalog worthy of your library",
              body: "Every volume — title, author, edition, category — organized by theology, ministry, missions, and more.",
            },
            {
              icon: Users,
              title: "Never lose a lent book again",
              body: "Log who borrowed what, when it's due, and quiet reminders when it's overdue.",
            },
            {
              icon: Flame,
              title: "Reading habits that hold",
              body: "Set goals, log progress, and grow a streak that outlasts your busiest weeks.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border/70 bg-card p-6 shadow-sm"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Your library. Private by default.</span>
          </div>
          <span>© {new Date().getFullYear()} Minister's Vault</span>
        </div>
      </footer>
    </div>
  );
}
