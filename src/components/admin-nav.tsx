import { Link } from "@tanstack/react-router";
import { ArrowLeft, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "schools", label: "Schools" },
  { id: "users", label: "Users" },
  { id: "activity", label: "Activity" },
] as const;

/**
 * Jump links for the super admin page, plus a route back to the member app.
 * On a school's own page the section links are replaced by a "back" link.
 */
export function AdminNav({ school = false }: { school?: boolean }) {
  return (
    <nav aria-label="Super admin sections" className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 md:px-8">
        {school ? (
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin" hash="schools">
              <ArrowLeft className="mr-2 h-4 w-4" /> All schools
            </Link>
          </Button>
        ) : (
          <ul className="flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/account">
            <UserCircle className="mr-2 h-4 w-4" /> My account
          </Link>
        </Button>
      </div>
    </nav>
  );
}
