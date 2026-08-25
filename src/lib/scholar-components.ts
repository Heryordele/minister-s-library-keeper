/**
 * Scholar's Professional: Component class patterns
 * Use these with cn() to apply Scholar's Professional styling consistently
 */

export const scholarComponents = {
  // Cards: White bg, 1px border, flat (no shadows)
  card: "scholar-card",
  cardHeader: "scholar-card-header",
  cardContent: "space-y-4",
  cardFooter: "border-t border-border pt-4 mt-4",

  // Buttons
  buttonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border-2 border-primary",
  buttonSecondary: "border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none",
  buttonAccent: "bg-accent text-accent-foreground hover:bg-accent/90 rounded-none border-2 border-accent",
  buttonGhost: "hover:bg-primary/10 text-foreground rounded-none",

  // Forms
  input: "border border-border rounded-none px-3 py-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",
  label: "label-md text-foreground block mb-1.5",
  textarea: "border border-border rounded-none px-3 py-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",

  // Tables
  table: "scholar-table w-full",
  tableHeader: "bg-primary text-primary-foreground font-label font-bold",
  tableRow: "border-b border-border hover:bg-yellow-50/50 transition-colors",
  tableCell: "px-4 py-3 text-left",

  // Typography
  displayLg: "display-lg",
  displayMd: "display-md",
  headlineLg: "headline-lg",
  headlineMd: "headline-md",
  bodyLg: "body-lg",
  bodyMd: "body-md",
  label: "label-md",
  labelSm: "label-sm",

  // Chips/Badges
  chip: "inline-flex items-center gap-1 px-3 py-1 rounded-none bg-surface-container text-foreground border border-outline text-sm font-label",
  chipPrimary: "inline-flex items-center gap-1 px-3 py-1 rounded-none bg-primary text-primary-foreground border border-primary text-sm font-label",
  chipAccent: "inline-flex items-center gap-1 px-3 py-1 rounded-none bg-accent text-accent-foreground border border-accent text-sm font-label",
  chipError: "inline-flex items-center gap-1 px-3 py-1 rounded-none bg-red-100 text-red-900 border border-red-200 text-sm font-label",

  // Layout spacing (uses CSS variables from styles.css)
  sectionGap: "gap-8",
  stackLg: "space-y-8",
  stackMd: "space-y-4",
  stackSm: "space-y-2",
};

export const scholarSpacing = {
  sidebarWidth: "280px",
  containerMax: "1440px",
  gutter: "32px",
  stackLg: "32px",
  stackMd: "16px",
  stackSm: "8px",
};
