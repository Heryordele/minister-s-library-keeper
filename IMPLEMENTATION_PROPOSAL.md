# Scholar's Professional Implementation Proposal
## Applying Google Stitch Design System to Minister's Vault App Surfaces

**Date:** August 25, 2026  
**Scope:** Complete redesign of Operate surfaces (dashboard, forms, tables, navigation) using Scholar's Professional system

---

## Executive Summary

Minister's Vault currently has **two intentionally distinct design systems:**

| Surface | Purpose | Current System | Proposed System |
|---------|---------|-----------------|-----------------|
| **Persuade** (Landing Page) | Convert signed-out visitors | The Minister's Card Catalog ✓ Complete | No change |
| **Operate** (App Dashboard) | Working tool for logged-in users | shadcn/ui defaults + Fraunces/Inter | Scholar's Professional |

**What this means:** The landing page stays exactly as built (card catalog, navy/gold, Source Serif 4 + Courier Prime). The *app* gets the professional institutional treatment—the dashboard, library view, lending tracker, settings, everything users interact with daily gets elevated.

---

## Scholar's Professional System (What You're Getting)

### Color Palette
- **Primary:** Deep Navy (#04162E, #1A2B44) — authority, navigation, headings
- **Accent:** Gold (#C5A059) — highlights, CTAs, active states (used sparingly)
- **Surfaces:** Tiered system (background #F9F9FF → surface-container levels → inverse-surface #263142)
- **Semantic:** Error handling, success, warning using semantic token structure
- **Philosophy:** "Tonal Layering" not heavy shadows — quiet depth via background shifts

### Typography (Three-Part Scale)
1. **Playfair Display** — headlines, display (48px, 36px, 30px) — editorial prestige
2. **Source Serif 4** — body content (18px, 16px) — academic legibility
3. **Hanken Grotesk** — labels, metadata, UI controls (14px, 12px) — clean efficiency

### Layout & Components
- **Sidebar Navigation:** 280px fixed left sidebar, Deep Navy background, Hanken Grotesk labels, Gold left-border active state
- **Cards:** White background, 1px grey border, Playfair Display headers, no shadows
- **Data Tables:** High-density, no vertical borders, Deep Navy headers, light Gold hover (row-level)
- **Buttons:** Navy background + white text (primary), Navy outline + Gold hover (secondary)
- **Input Fields:** 1px border, 2px Gold outline on focus
- **Spacing Grid:** 8px base, 32px/64px stacks for module separation

---

## Implementation Plan

### Phase 1: Token System (Tailwind Config + CSS Variables)
**Files to change:**
- `tailwind.config.ts` — Add new color palette, typography, extend spacing
- `src/styles.css` — Define CSS custom properties for the Scholar's Professional palette
- Create `src/lib/design-tokens.ts` — Export token system for component usage

**New tokens to add:**
```
Colors:
  --color-primary: #04162E (navy-deep)
  --color-primary-container: #1A2B44 (navy-lighter)
  --color-secondary: #775A19 (gold-base)
  --color-surface: #F9F9FF (soft white)
  --color-surface-dim: #CFDAF1
  --color-surface-container: #E7EEFF
  --color-outline: #75777E (muted borders)
  --color-error: #BA1A1A (overdue red)

Typography:
  --font-display: "Playfair Display", ui-serif
  --font-body: "Source Serif 4", ui-serif
  --font-label: "Hanken Grotesk", ui-sans-serif
  
Spacing:
  --sidebar-width: 280px
  --container-max: 1440px
  --gutter: 32px
  --stack-lg: 32px
```

**Estimated effort:** 2–3 hours

---

### Phase 2: Layout Restructuring (Navigation & Sidebar)
**Current state:** Top navigation bar, collapsible sidebar or floating nav  
**Target state:** Fixed 280px left sidebar (desktop), stacked on mobile

**Files to change:**
- `src/routes/__root.tsx` — Add sidebar layout, restructure main content grid
- `src/components/page-header.tsx` — Adjust for sidebar presence
- `src/routes/_authenticated.tsx` — Wrapper for authenticated layout

**Changes:**
- Desktop: Main layout becomes `flex` with 280px fixed sidebar + fluid content
- Mobile: Sidebar collapses to hamburger/drawer, full-width content
- Sidebar background: Navy Deep (#04162E)
- Sidebar navigation items: Hanken Grotesk, light grey text, Gold left-border on active

**Estimated effort:** 4–5 hours

---

### Phase 3: Component Updates (Buttons, Cards, Forms, Tables)
**Components to redesign:**

1. **Buttons**
   - Primary: Navy background, white text, no rounded corners (professional)
   - Secondary: Navy outline, Gold text on hover
   - File: `src/components/ui/button.tsx`

2. **Cards**
   - Background: White (#FFFFFF)
   - Border: 1px muted grey (#D1D5DB)
   - Header: Playfair Display, Navy text
   - Padding: 1.5rem–2rem
   - No shadows (flat design per Tonal Layering)
   - File: `src/components/ui/card.tsx` or new wrapper

3. **Forms & Input Fields**
   - Border: 1px outline color
   - Focus state: 2px Gold outline
   - Label: Hanken Grotesk, bold, Navy text
   - File: `src/components/ui/input.tsx`, `src/components/ui/label.tsx`

4. **Data Tables**
   - Header row: Deep Navy background, Hanken Grotesk Bold, white text
   - Row hover: Light Gold tint (#FAF7F0) — entire row, no vertical borders
   - Borders: Only horizontal 1px lines between rows
   - File: Create `src/components/ui/data-table.tsx` or update existing

5. **Metadata Chips/Tags**
   - Background: Light grey (#F3F4F6)
   - Text: Navy, Hanken Grotesk
   - Border: 1px outline-variant
   - File: `src/components/ui/badge.tsx`

**Estimated effort:** 6–8 hours

---

### Phase 4: Dashboard Pages (Reading, Library, Lending, Analytics)
**Key pages to redesign:**

1. **Reading Dashboard** (`src/routes/_authenticated/reading.tsx`)
   - Header: Playfair Display "Reading dashboard" in Navy
   - Stats grid: High-density card layout with Hanken Grotesk labels, Navy values
   - Goals section: Card panel with table of reading goals (high-density)
   - Streak visualization: Updated styling with Navy/Gold accent

2. **Library View** (`src/routes/_authenticated/library.tsx`)
   - Sidebar filters: Left sidebar with Hanken Grotesk filter labels, checkboxes
   - Book grid/table toggle: High-density card list or data table with cover thumbnails
   - Table view: headers in Navy + Hanken Grotesk, book titles in Source Serif 4
   - Sort/filter controls: Navy buttons with Gold hover

3. **Lending Tracker** (`src/routes/_authenticated/lending.tsx`)
   - Active loans: High-density data table (borrower, title, due date, status chip)
   - Status chips: Navy background for "borrowed," Red (#BA1A1A) for "overdue"
   - Due date column: Source Serif 4 body, Navy text, Gold accent if overdue

4. **Analytics/Reports** (if exists)
   - Charts/graphs: Navy for lines/bars, Gold for highlights
   - Data labels: Hanken Grotesk
   - Card backgrounds: Tiered surface containers

**Estimated effort:** 8–10 hours

---

### Phase 5: Form Pages & Settings
**Pages to update:**

1. **Add/Edit Book** (`src/routes/_authenticated/books/new.tsx`, etc.)
   - Form layout: Left sidebar (280px) + form panel (400px max-width, centered)
   - Labels: Hanken Grotesk Bold, Navy
   - Inputs: 1px border, 2px Gold on focus
   - Submit button: Navy background + white text

2. **Book Details** (`src/routes/_authenticated/books/$bookId.tsx`)
   - Header: Playfair Display title, Navy text
   - Metadata grid: Hanken Grotesk labels on left, Source Serif 4 values
   - Lending history table: Data table styling (Navy headers, no vertical borders)

3. **Settings/Account** (`src/routes/_authenticated/account.tsx`)
   - Sections as cards: White background, 1px border, Playfair Display section headers
   - Form controls: Updated input/button styling
   - Destructive actions: Red (#BA1A1A) for delete/logout buttons

**Estimated effort:** 4–6 hours

---

### Phase 6: Mobile Responsive (All Pages)
**Breakpoints:**
- **Mobile (< 640px):** Sidebar hidden, hamburger menu, full-width content, larger touch targets
- **Tablet (640px–1024px):** Collapsible sidebar, adjusted spacing
- **Desktop (> 1024px):** Fixed 280px sidebar, full layout as designed

**Grid adjustments:**
- Mobile book grid: 1 column
- Tablet book grid: 2 columns
- Desktop book grid: 3–4 columns

**Estimated effort:** 3–4 hours

---

## Total Estimated Timeline

| Phase | Hours | Cumulative |
|-------|-------|-----------|
| Phase 1: Token System | 2–3 | 2–3 |
| Phase 2: Layout/Sidebar | 4–5 | 6–8 |
| Phase 3: Components | 6–8 | 12–16 |
| Phase 4: Dashboard Pages | 8–10 | 20–26 |
| Phase 5: Forms/Settings | 4–6 | 24–32 |
| Phase 6: Mobile Responsive | 3–4 | 27–36 |
| **Total** | **27–36** | **27–36** |

**Realistic estimate:** 3–5 days of focused work, or phased over 1–2 weeks

---

## What Stays Unchanged

1. **Landing Page** (`src/routes/index.tsx`) — The Minister's Card Catalog design, all fonts, colors, layout STAY AS-IS
2. **Authentication Flow** (`src/routes/auth.tsx`) — Keep current design (it's not an Operate surface)
3. **Database Schema** — No changes to Supabase tables or API
4. **Core Functionality** — Barcode scanning, ISBN lookup, lending tracking, reading goals all work identically
5. **Lovable Editor** — Project remains synced to Lovable, no conflicts

---

## Design System Isolation

**This is critical:** We're maintaining two intentional design registers:

```
Signed-Out User:
  Landing Page ← Minister's Card Catalog (navy/gold, Source Serif 4, stamp buttons)

Signed-In User:
  App Dashboard ← Scholar's Professional (navy/gold, Playfair+Hanken Grotesk, sidebar nav)
```

Both use navy + gold, but with **different visual registers for different mental modes.** The landing page is "museum of the product," the app is "the work environment."

---

## Approval Checklist

Before I implement, please confirm:

- [ ] Proceed with Phase 1 (Token System)?
- [ ] Proceed with Phase 2 (Sidebar Layout)?
- [ ] Proceed with Phase 3 (Components)?
- [ ] Proceed with Phase 4 (Dashboard Pages)?
- [ ] Proceed with Phase 5 (Forms/Settings)?
- [ ] Proceed with Phase 6 (Mobile Responsive)?
- [ ] Commit changes continuously to git?
- [ ] Deploy to Vercel after each major phase?

Or would you prefer I implement all phases in one go (larger commit, higher risk)?

---

## Next Steps

**Option A: Implement all phases now** — One large commit, comprehensive redesign done in one push  
**Option B: Phase it gradually** — Commit Phase 1–2 today, Phase 3–4 tomorrow, etc., with live testing between  
**Option C: Prioritize critical pages** — Do Phases 1–2 + Phase 4 (Dashboard), skip others initially

**Your call.**
