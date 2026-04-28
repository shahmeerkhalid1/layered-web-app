"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  FileText,
  Users,
  BarChart3,
  Menu,
  X,
  Shield,
  Settings,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  // { href: "/calendar", label: "Calendar", icon: Calendar },
  // { href: "/exercises", label: "Exercises", icon: Dumbbell },
  // { href: "/templates", label: "Templates", icon: FileText },
  // { href: "/clients", label: "Clients", icon: Users },
  // { href: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/users", label: "User Management", icon: UserPlus },
  { href: "/admin/exercises", label: "Seed Exercises", icon: Dumbbell },
  { href: "/admin/stats", label: "Platform Stats", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      <div className="mb-6 px-3">
        <h1 className="text-lg font-bold tracking-tight">Pilates Platform</h1>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <Separator className="my-4" />
          <span className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </span>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
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
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar text-sidebar-foreground transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar md:text-sidebar-foreground">
        {navContent}
      </aside>
    </>
  );
}
