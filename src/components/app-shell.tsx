import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Flame,
  BarChart3,
  UserCircle,
  LogOut,
  BookMarked,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OnboardingGate } from "@/components/onboarding-gate";
import { NotificationBell } from "@/components/notification-bell";


const NAV = [
  { to: "/reading", label: "Reading", icon: Flame },
  { to: "/library", label: "Library", icon: BookMarked },
  { to: "/lending", label: "Lending", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <OnboardingGate>
      <div className="min-h-screen bg-background text-foreground md:flex">
        <DesktopSidebar />
        <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
          <MobileHeader />
          <main className="flex-1">{children}</main>
        </div>
        <MobileBottomNav />
      </div>
    </OnboardingGate>
  );
}

function DesktopSidebar() {
  const location = useLocation();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-5 py-6">

        <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <div className="font-serif text-base font-semibold leading-tight">
            Minister's Vault
          </div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
            Your library
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/account"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            location.pathname === "/account"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <UserCircle className="h-4 w-4" />
          Account
        </Link>
        <SignOutButton className="mt-1 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground" />
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-serif text-base font-semibold">Minister's Vault</span>
      </div>
      <Link
        to="/account"
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground"
        aria-label="Account"
      >
        <UserCircle className="h-5 w-5" />
      </Link>
    </header>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={loading} className={className}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  );
}

// Suppress unused-import warning for useEffect (tree-shaken if not needed later)
void useEffect;
