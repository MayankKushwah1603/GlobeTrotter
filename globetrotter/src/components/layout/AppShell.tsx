import { Link, useRouter } from "@tanstack/react-router";
import { Bookmark, Compass, LayoutGrid, LogOut, Map, Menu, Plus, Settings, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/trips", label: "My Trips", icon: Map },
  { to: "/explore/cities", label: "Explore", icon: Compass },
  { to: "/saved", label: "Saved Places", icon: Bookmark },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Compass className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">GlobeTrotter</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const metaName = user?.user_metadata?.["full_name"] as string | undefined;
  const name = metaName || user?.email?.split("@")[0] || "Traveller";

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <div className="flex-1 px-3 py-2">
          <NavLinks />
        </div>
        <div className="space-y-1 border-t border-border px-3 py-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">
              Welcome back, <span className="text-foreground">{name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="sm">
              <Link to="/trips/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Plan New Trip</span>
              </Link>
            </Button>
            <Link
              to="/settings"
              aria-label="Profile settings"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-xs font-medium"
            >
              {initials(name)}
            </Link>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 md:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar p-4">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="mt-4 space-y-1 border-t border-border pt-4">
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
