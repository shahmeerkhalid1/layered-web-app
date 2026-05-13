"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  X,
  Settings,
  UserPlus,
  Calendar,
  Dumbbell,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/class-plans", label: "Class Plans", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
];

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: UserPlus },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();
  // const isAdminRoute = pathname.startsWith("/admin");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex h-full flex-col gap-1 px-3 py-4">
      <div className="mb-6 rounded-3xl border border-sidebar-border bg-card p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Dumbbell className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Studio
            </p>
            <h1 className="text-base font-semibold tracking-[-0.03em] text-card-foreground">
              Pilates Platform
            </h1>
          </div>
        </div>
      </div>
      {!isAdmin &&
        navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={`main-${item.label}`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active
                    ? "text-secondary-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}

      {isAdmin && (
        <>
          <Separator className="my-4 bg-sidebar-border" />
          <span className="mb-1 px-3 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Admin
          </span>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={`admin-${item.label}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar md:text-sidebar-foreground">
        {navContent}
      </aside>
    </>
  );
}
