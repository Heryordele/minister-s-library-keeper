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
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex" style={{ width: '280px' }}>
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="grid h-10 w-10 place-items-center bg-accent text-accent-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-display text-base font-semibold leading-tight text-sidebar-foreground">
            Minister's Vault
          </div>
          <div className="label-sm mt-1 text-sidebar-foreground/60">
            Your library
          </div>
        </div>
        <NotificationBell className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all",
                "border-l-2",
                active
                  ? "border-l-accent bg-sidebar-accent/20 text-accent"
                  : "border-l-transparent text-sidebar-foreground/80 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border space-y-2 p-4">
        <Link
          to="/account"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all border-l-2",
            location.pathname === "/account"
              ? "border-l-accent bg-sidebar-accent/20 text-accent"
              : "border-l-transparent text-sidebar-foreground/80 hover:text-sidebar-foreground",
          )}
        >
          <UserCircle className="h-5 w-5" />
          <span className="font-label">Account</span>
        </Link>
        <SignOutButton className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground border-l-2 border-l-transparent px-3 py-2.5 text-sm font-label" />
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-primary/5 px-4 py-4 md:hidden">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <span className="font-display text-base font-semibold text-foreground">Minister's Vault</span>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link
          to="/account"
          className="grid h-9 w-9 place-items-center border border-border text-muted-foreground rounded-full"
          aria-label="Account"
        >
          <UserCircle className="h-5 w-5" />
        </Link>
      </div>
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
