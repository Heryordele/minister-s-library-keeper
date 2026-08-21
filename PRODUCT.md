# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Pastor Emmanuel** — senior pastor, 40–65, moderate tech proficiency, primarily on mobile. Wants fast cataloging and reliable lending reminders; short, irregular sessions between pastoral duties.

**Sarah** — theological student, 20–30, high tech proficiency, budget-conscious. Wants free-tier value and quick barcode scanning; comfortable navigating a denser interface.

**Grace Bible College Admin** — institutional user needing a shared library and reporting view. Phase 2 — not built yet, not a target of the current landing page.

## Product Purpose

Minister's Vault ("The Minister's Library Keeper") is a cloud-based digital library management and reading accountability platform for ministers, pastors, theological students, and ministry institutions. It exists because a minister's personal theological library is both a working tool and an act of stewardship — books get lent out and lost, purchases go untracked, and reading discipline erodes under ministry demands. Success is a minister who can find any book in seconds, never loses a lent volume, and sustains a reading rhythm across years of ministry.

## Positioning

Generic library-cataloging apps and generic habit trackers both exist; neither combines library stewardship *and* reading discipline *and* is built around a minister's actual taxonomy (Theology, Christian Ministry, Spiritual Growth, Missions & Evangelism, Personal Development, Biography & History) and actual social pattern (lending books to congregants, students, and colleagues, tracked by name/phone/organization). Minister's Vault's mechanism is: a library structured for ministry, lending accountability by name, and reading goals tied to that same library — one system, not three.

## Operating Context

- Cataloging: manual entry, ISBN barcode scan (camera), or bulk import (CSV/Excel).
- Lending: track borrower name/phone/email/organization, due date, return status; overdue and pre-due reminders.
- Reading: goals (daily/weekly/monthly/quarterly/annual, by pages or books), progress logging with notes/key lessons, streak tracking.
- Reminders currently deliver in-app (bell icon) and — as of a recent build — real email via Resend for the daily server-side sweep (lending due/overdue, habit nudges at 1/3/7+ days of inactivity).
- Deployed on Vercel; Supabase (Postgres, Auth, Storage) backend; built originally via Lovable.
- Reading Dashboard is the default landing view for returning logged-in users — this marketing/landing page is only what a signed-out visitor sees.

## Capabilities and Constraints

- Auth: email/password + Google OAuth today; Microsoft OAuth is Phase 2.
- Plans referenced in the data model: free / premium / institutional — no pricing page or plan comparison exists yet on this landing page; do not fabricate pricing.
- Institutional multi-user library (Grace Bible College Admin persona) is explicitly Phase 2 — do not represent it as available now.
- AI features (cover recognition via photo, receipt extraction, email purchase detection) are Could-Have, not yet built — do not depict them as shipped.
- Mobile-first is a hard constraint given Pastor Emmanuel's primary device and usage pattern.

## Brand Commitments

- Name: **Minister's Vault** (project/repo also referred to as "Minister's Library Keeper" / "The Minister's Library Keeper").
- Tagline (binding, from the PRD): **"Preserving Knowledge. Building Discipline. Protecting Legacy."**
- Tone: warm, trustworthy, scholarly — "a well-kept study," explicitly not a corporate SaaS dashboard and not childish.
- Palette (binding): deep navy/charcoal as primary, warm gold/bronze accent, off-white background. Avoid bright primary blues/purples — this is a deliberate contrast against generic SaaS visual language.
- Typography (binding): serif or slab-serif for headings (gravitas), clean sans-serif for body/UI text.
- These commitments come from the original PRD/concept note, not from the incumbent landing page's current (generic, safe) execution — the current page under-executes this brand direction rather than defining it. Full creative latitude within these commitments; the commitments themselves are fixed for this pass.

## Evidence on Hand

None. No real testimonials, user quotes, institutional partnerships, or usage numbers exist yet. The landing page must sell on the product's own mechanism and narrative — no fabricated social proof, logos, or stats.

## Product Principles

1. Stewardship, not productivity — the product frames cataloging and lending as protecting something valuable (a library, a legacy), not as generic task management.
2. Ministry-specific, not generic — taxonomy, lending patterns, and language should read as built *for* this audience, not a general-purpose app with ministry copy pasted on.
3. Quiet confidence over hype — the "well-kept study" tone rules out loud SaaS conventions (aggressive gradients, exclamation-heavy copy, countdown urgency).
4. Mobile-first execution — Pastor Emmanuel's primary and often only device is his phone; the landing page must be exceptional on mobile, not merely responsive.
5. Honest about maturity — no fabricated proof, no Phase 2 features presented as shipped.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility practice.
