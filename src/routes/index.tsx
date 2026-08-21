import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,500&family=Courier+Prime:wght@400;700&display=swap",
      },
    ],
  }),
  component: Landing,
});

const TAXONOMY = [
  { code: "TH", label: "Theology", note: "Systematic · Practical · Biblical" },
  { code: "CM", label: "Christian Ministry", note: "Pastoral · Administration · Leadership" },
  { code: "SG", label: "Spiritual Growth", note: "Prayer · Revival · Faith · Worship" },
  { code: "ME", label: "Missions & Evangelism", note: "Evangelism · Church Planting" },
  { code: "PD", label: "Personal Development", note: "Leadership · Finance · Productivity" },
  { code: "BH", label: "Biography & History", note: "Church History · Missionary Lives" },
];

const LOANS = [
  { who: "Deacon Adeyemi", title: "Knowing God", due: "Mar 14", status: "borrowed" as const },
  { who: "Sarah — MDiv '26", title: "Desiring God", due: "Feb 28", status: "overdue" as const },
  { who: "Elder Grace", title: "Institutes, Vol. I", due: "Apr 2", status: "borrowed" as const },
];

function Landing() {
  return (
    <div className="mv-catalog min-h-screen bg-background text-foreground">
      {/*
        THESIS: A minister's library is a classification system to be trusted,
        not a feed to scroll — refuses the cozy-bookshelf/cream-lamplight cliché.
        OWN-WORLD: Navy/charcoal ground, gold load-bearing only where a physical
        catalog drawer would put brass (tabs, stamps, call numbers). Source Serif 4
        for card titles, Courier Prime for call-number/stamp codes, Inter body.
        STORY: land on the product's own master catalog card → see cataloging as
        classification (real taxonomy, real call numbers) → lending as a vestry
        ledger → reading as a renewal-stamp streak → request your own card.
        FIRST VIEWPORT: one oversized catalog card fills the hero, title as the
        card's title line, tagline as subject tracings, CTA as a charge stamp.
        FORM: assigned index 4, seed key 55134c95 — Seminary Card Catalog fused
        with vestry-ledger lending; grounded list authored for this product.
        FINISH: unreviewed and undocumented is unfinished; this build ends with
        the finish review, the verdict, and DESIGN.md.
      */}

      <header className="border-b border-primary/15 bg-primary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="font-catalog-mono grid h-9 w-11 place-items-center rounded-sm border border-accent/50 bg-primary text-xs font-bold tracking-widest text-accent"
            >
              MV
            </div>
            <span className="font-catalog-serif text-lg font-semibold tracking-tight text-primary-foreground">
              Minister's Vault
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="border border-accent/60 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Request a card
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* First viewport — the master catalog card, pulled from a drawer of them */}
        <section className="relative overflow-hidden bg-primary px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--color-accent) 0px, var(--color-accent) 1px, transparent 1px, transparent 28px)",
            }}
          />
          {/* Drawer rail — instant graphic anchor before any text registers */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent/0 via-accent to-accent/0"
          />

          <div className="relative mx-auto max-w-4xl pt-6">
            {/* Ghost cards — a drawer full, not one slip alone */}
            <div
              aria-hidden
              className="absolute inset-x-4 top-6 hidden rotate-[3deg] rounded-sm border border-accent/25 bg-card/40 sm:block"
              style={{ height: "calc(100% - 24px)" }}
            />
            <div
              aria-hidden
              className="absolute inset-x-2 top-3 hidden -rotate-[2deg] rounded-sm border border-accent/35 bg-card/70 sm:block"
              style={{ height: "calc(100% - 12px)" }}
            />

            <div className="mv-card-reveal relative rounded-sm border border-border bg-card px-7 py-9 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.65)] sm:px-12 sm:py-12">
              <div
                aria-hidden
                className="absolute left-6 top-6 h-2.5 w-2.5 rounded-full border border-border bg-background sm:left-8"
              />
              <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4 pl-6 sm:pl-8">
                <span className="font-catalog-mono text-xs font-bold tracking-[0.15em] text-accent-foreground">
                  <span className="rounded-sm bg-accent/20 px-1.5 py-0.5 text-accent-foreground">
                    MV&nbsp;001
                  </span>
                </span>
                <span className="font-catalog-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Master card
                </span>
              </div>

              <h1 className="font-catalog-serif mt-7 pl-6 text-5xl font-semibold leading-[1.03] tracking-tight sm:pl-8 sm:text-6xl md:text-7xl">
                Preserving Knowledge.
                <br />
                <span className="text-accent-foreground/90">Building Discipline.</span>
                <br />
                Protecting Legacy.
              </h1>

              <ol className="mt-8 space-y-2 border-t border-border/70 pl-6 pt-6 text-base text-muted-foreground sm:pl-8">
                <li>
                  <span className="font-catalog-mono mr-2 text-accent-foreground/70">1.</span>
                  Cataloging — organized by a classification built for ministry, not generic tags.
                </li>
                <li>
                  <span className="font-catalog-mono mr-2 text-accent-foreground/70">2.</span>
                  Lending — every loan tracked by name, the way a vestry ledger always has.
                </li>
                <li>
                  <span className="font-catalog-mono mr-2 text-accent-foreground/70">3.</span>
                  Reading — a rhythm that holds, stamped and renewed one day at a time.
                </li>
              </ol>

              <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-border/70 pl-6 pt-7 sm:pl-8">
                <Button
                  asChild
                  size="lg"
                  className="font-catalog-mono relative -rotate-2 rounded-none border-2 border-accent bg-transparent px-7 py-6 text-base text-accent-foreground shadow-none hover:bg-accent/10"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Request your card
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  to="/auth"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Already catalogued? Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Classification section — real taxonomy as drawer tabs */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <h2 className="font-catalog-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              A library kept the way a seminary keeps one.
            </h2>
            <p className="mt-4 max-w-[65ch] text-muted-foreground">
              Not folders, not free-text tags. Every volume takes a place in a classification built
              specifically for ministry — the same six groups a theological library has used for
              generations, each with its own call number.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {TAXONOMY.map((t) => (
              <div key={t.code} className="group relative bg-card px-5 py-5">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-accent/0 transition-colors group-hover:bg-accent"
                />
                <span className="font-catalog-mono inline-block rounded-sm bg-primary px-2 py-0.5 text-xs font-bold tracking-widest text-primary-foreground">
                  {t.code}
                </span>
                <h3 className="font-catalog-serif mt-3 text-lg font-semibold">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Lending section — the vestry ledger */}
        <section className="border-y border-border bg-secondary/40 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-md">
              <h2 className="font-catalog-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Lending, kept like a vestry ledger.
              </h2>
              <p className="mt-4 max-w-[60ch] text-muted-foreground">
                Churches have tracked loaned property by name for centuries. Minister's Vault does
                the same for books — who has it, since when, and when it's due — with a quiet
                reminder before it's forgotten, not after.
              </p>
            </div>

            <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
              <div className="font-catalog-mono flex items-center justify-between border-b border-border bg-primary px-4 py-2 text-[11px] uppercase tracking-widest text-primary-foreground/80">
                <span>Borrower</span>
                <span>Due</span>
              </div>
              <ul>
                {LOANS.map((loan, i) => (
                  <li
                    key={loan.who}
                    className={`flex items-center justify-between gap-4 px-4 py-3.5 text-sm ${
                      i !== LOANS.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{loan.who}</p>
                      <p className="truncate text-xs text-muted-foreground">{loan.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-catalog-mono text-xs text-muted-foreground">
                        {loan.due}
                      </span>
                      <span
                        className={`font-catalog-mono rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          loan.status === "overdue"
                            ? "border-destructive/40 text-destructive"
                            : "border-accent/50 text-accent-foreground"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reading habit section — the renewal stamp */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 flex flex-wrap gap-2 lg:order-1">
              {Array.from({ length: 14 }).map((_, i) => {
                const filled = i < 9;
                return (
                  <div
                    key={i}
                    aria-hidden
                    className={`font-catalog-mono grid h-11 w-11 -rotate-3 place-items-center rounded-sm border text-[10px] font-bold ${
                      filled
                        ? "border-accent bg-accent/15 text-accent-foreground"
                        : "border-border text-muted-foreground/50"
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div className="order-1 max-w-md lg:order-2">
              <h2 className="font-catalog-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Reading, stamped and renewed.
              </h2>
              <p className="mt-4 max-w-[60ch] text-muted-foreground">
                Set a goal, log a page or a book, and watch the streak hold — one stamp at a time,
                the way a call slip gets renewed. Discipline that survives your busiest weeks, not
                just your best ones.
              </p>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-primary px-6 py-20 text-center md:py-28">
          <h2 className="font-catalog-serif mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Your library deserves a catalog card.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
            Free to start. Built for ministers, pastors, and theological students.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="font-catalog-mono border-2 border-accent bg-accent px-8 text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Request your card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>Your library. Private by default.</span>
          </div>
          <span className="font-catalog-mono">© {new Date().getFullYear()} Minister's Vault</span>
        </div>
      </footer>
    </div>
  );
}
