---
name: Minister's Vault
description: Preserving Knowledge. Building Discipline. Protecting Legacy.
colors:
  navy-deep: "oklch(0.26 0.045 260)"
  gold-bronze: "oklch(0.72 0.13 72)"
  parchment: "oklch(0.975 0.012 85)"
  card-white: "oklch(1 0 0)"
  ledger-line: "oklch(0.88 0.02 80)"
  overdue-red: "oklch(0.55 0.2 27)"
typography:
  catalog-display:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  catalog-label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.15em"
  operate-display:
    fontFamily: "Fraunces, ui-serif, Georgia, Cambria, Times New Roman, serif"
    fontWeight: 600
    letterSpacing: "-0.01em"
  operate-body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
rounded:
  sm: "2px"
  md: "6px"
spacing:
  card-padding: "1.75rem–2.5rem"
  section: "5rem–7rem"
components:
  button-catalog-primary:
    backgroundColor: "{colors.gold-bronze}"
    textColor: "oklch(0.22 0.03 260)"
    rounded: "0px"
    padding: "10px 32px"
  catalog-card:
    backgroundColor: "{colors.card-white}"
    textColor: "oklch(0.22 0.03 260)"
    rounded: "{rounded.sm}"
---

# Design System: Minister's Vault

## Overview

**Creative North Star: "The Minister's Card Catalog"**

Minister's Vault runs two registers, deliberately. The **marketing/landing surface** (Persuade) is built as a seminary theological classification system fused with a church vestry ledger — the product's mechanism (catalog, lend, read) rendered as the physical rituals a minister already trusts: a catalog card's title and subject tracings, a ledger's borrower-and-due-date row, a call slip's renewal stamp. The **application surface** (Operate — dashboard, forms, library management) stays a calmer, standard "well-kept study" register: navy/charcoal, gold accent, Fraunces headings, Inter body, ordinary interface conventions, because a working tool should not perform.

The landing page explicitly rejects the category default for this subject: cream parchment ground, romantic serif display, warm lamplight photography. That look is the trap every AI-generated "library" or "book" product reaches for. Instead, gold is load-bearing — it appears only where a physical catalog drawer would put brass (index tabs, stamp ink, call-number chips) — and the page ground is navy/charcoal, with off-white reserved specifically for the paper/card-stock surfaces themselves.

**Key Characteristics:**
- Navy/charcoal as a committed dark ground on Persuade sections, not just a "primary button color"
- Gold/bronze used only as brass-hardware would be used: tabs, stamps, chips, labels — never a whole-section wash
- A real, authored classification system (call numbers, subject tracings) standing in for generic feature-card iconography
- Courier Prime (mono) exclusively for "official record" elements — call numbers, stamps, dates — never body copy
- Operate surfaces keep their own established system (Fraunces/Inter/shadcn) untouched by this pass

## Colors

The palette is restrained-to-committed: two dominant fields (navy, off-white/parchment) plus one load-bearing accent (gold/bronze), used with intent rather than scattered.

### Primary
- **Navy Deep** (`oklch(0.26 0.045 260)`): the Persuade page's dominant ground (header, hero, closing CTA) and the Operate app's primary button/accent color. Reads as ink, not corporate blue — desaturated, cool, near-charcoal.

### Secondary
- **Gold Bronze** (`oklch(0.72 0.13 72)`): the single accent. On the landing page it is load-bearing only — call-number chips, the CTA's stamp-styled border, index-tab hover states, renewal-stamp fills. Never used as a full-section background.

### Neutral
- **Parchment** (`oklch(0.975 0.012 85)`): the app's overall page background (Operate surfaces) and the landing page's off-white card stock — reserved for literal "paper" surfaces (catalog cards, ledger panel), not the whole Persuade page ground.
- **Card White** (`oklch(1 0 0)`): true white for elevated cards/popovers.
- **Ledger Line** (`oklch(0.88 0.02 80)`): borders, ledger row dividers, drawer-tab grid lines.
- **Overdue Red** (`oklch(0.55 0.2 27)`): the one status color, used exclusively for the "overdue" ledger badge — matches the app's existing destructive token, not a new hue.

### Named Rules
**The Brass-Only Rule.** Gold appears exactly where a physical catalog drawer or ledger would place brass hardware — tabs, stamps, call-number chips, index labels. It never fills a full section or a whole card background.

## Typography

**Display Font (Persuade):** Source Serif 4 (with Georgia, Times New Roman fallback)
**Label/Mono Font (Persuade):** Courier Prime (with Courier New fallback) — call numbers, stamps, dates, status badges only
**Body Font (both surfaces):** Inter
**Display Font (Operate):** Fraunces — unchanged, used app-wide outside the landing page

**Character:** Source Serif 4 reads as an institutional, document-grade serif — a typed catalog-card title line, not a romantic display face. Courier Prime carries the "official record" register: anything stamped, numbered, or dated wears it. Inter stays the workhorse voice for actual reading content on both surfaces.

### Hierarchy
- **Display** (600, `clamp(2rem, 5vw, 3rem)`, 1.08 line-height): the hero master-card title and section headings on the landing page, in Source Serif 4.
- **Label** (700, 0.75rem, 0.15em tracking, uppercase or as-cased): call-number chips, ledger status badges, "Master card" eyebrow-equivalent — in Courier Prime.
- **Body** (400, 1rem, `max-width: 65ch`): landing-page paragraph copy, in Inter, matching the app's existing body scale.

### Named Rules
**The Mono-Means-Official Rule.** Courier Prime is reserved for elements standing in for a stamped or catalogued artifact (call numbers, due dates, statuses). It is never used for ordinary body or UI copy — that would flatten it from "official record" to "technical costume."

## Layout

The landing page alternates full-bleed navy sections (hero, closing CTA) with off-white content sections (classification grid, ledger demo, reading-streak demo) at a `max-w-6xl` container, generous vertical rhythm (`py-20` to `py-28` between sections, more space above a heading than below it). The hero's catalog card is capped at `max-w-3xl` and centered, echoing a single physical card rather than a full-width hero banner. The classification grid uses a `1px` hairline gap on a bordered background (simulating drawer-tab dividers) rather than gapped cards. Responsive: single column below `sm`, the taxonomy grid steps 1→2→3 columns at `sm`/`lg`; the ledger and reading-streak sections stack to a single column below `lg`.

## Elevation & Depth

Flat by default, with one deliberate exception: the hero's master catalog card carries a soft, offset shadow (`shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]`) to read as a physical card resting on the navy ground — not a UI-panel elevation, a tabletop one. No other landing-page element uses a shadow; the ledger panel and classification tiles are flat with hairline borders only, consistent with the app's existing flat Operate surfaces.

### Named Rules
**The One-Shadow Rule.** Exactly one element on the landing page carries a shadow — the hero card. Every other surface stays flat with a border, so the hero's physical-object read isn't diluted by decorative depth elsewhere.

## Shapes

Sharp-to-slightly-softened rectangles throughout — `rounded-sm` (2px) on cards and chips, echoing card stock and ledger paper rather than the app's softer `rounded-md`/`rounded-lg` UI chrome. The primary CTA button is fully square-cornered with a 2px border and a slight `-rotate-2` tilt, styled as a rubber ink stamp rather than a standard button. A small circular "punch hole" (a 10px dot, top-left of the hero card) is the one purely decorative flourish, referencing a physical library card's securing-rod hole.

## Components

### Buttons (Persuade)
- **Shape:** square corners (0px radius), 2px border — a stamp, not a standard button.
- **Primary (hero/closing CTA):** transparent or gold-filled background, gold border, Courier Prime label, slight counter-rotation (`-rotate-2`).
- **Nav CTA:** solid gold fill, standard button radius inherited from the shared `Button` primitive (kept for nav-bar consistency; the stamp treatment is reserved for the two committed CTAs).
- **Ghost (Sign in):** transparent, primary-foreground text at reduced opacity, standard hover state.

### Cards / Containers (Persuade)
- **Corner Style:** `rounded-sm` (2px).
- **Background:** card-white / parchment ("card stock").
- **Shadow Strategy:** hero card only — see Elevation & Depth.
- **Border:** 1px, ledger-line color, on every non-hero panel.
- **Internal Padding:** `1.75rem` mobile, `2.5rem` desktop on the hero card; `1.25rem` on classification tiles and ledger rows.

### Ledger List (signature component)
A bordered panel with a navy header row (Courier Prime labels) and stacked rows separated by hairline borders — borrower name/title on the left, due date and a status chip (mono, bordered, color-coded only for "overdue") on the right. Directly dramatizes the lending-accountability mechanism rather than describing it in prose.

### Classification Grid (signature component)
A hairline-divided grid of tiles, one per real taxonomy group (Theology, Christian Ministry, Spiritual Growth, Missions & Evangelism, Personal Development, Biography & History), each carrying an invented two-letter call-number chip (navy background, mono, e.g. `TH`, `CM`) and a subgroup note. Replaces the generic icon-plus-heading-plus-text feature-card pattern with the product's own real classification system.

### Navigation
- Solid navy background (not translucent/blurred), Source Serif 4 wordmark, a small `MV` call-number-styled logo chip in place of an icon mark. Sign-in as a ghost link, "Request a card" as the solid gold CTA.

## Do's and Don'ts

### Do:
- **Do** keep gold strictly load-bearing (brass-hardware rule) — chips, tabs, stamps, never a full-section fill.
- **Do** use Courier Prime only for stamped/numbered/dated "official record" elements.
- **Do** reserve the hero card's shadow as the page's one depth moment.
- **Do** keep the landing page's fonts (Source Serif 4, Courier Prime) scoped under `.mv-catalog` — the Operate app's Fraunces/Inter tokens are a separate, intentionally calmer system and should not inherit this page's register.

### Don't:
- **Don't** use cream/parchment as a whole-page ground on Persuade surfaces — parchment is card stock, not atmosphere.
- **Don't** add a kicker/eyebrow label above any heading — headings carry their own weight.
- **Don't** revert to same-size icon+heading+text cards for feature explanation — use the product's own classification/ledger/stamp vocabulary instead.
- **Don't** fabricate testimonials, partner logos, or usage numbers — PRODUCT.md confirms none exist yet.
