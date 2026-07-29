import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-4 py-6 md:px-8 md:py-8">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      {icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
