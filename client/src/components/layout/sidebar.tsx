"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Menu,
  X,
  UserPlus,
  Calendar,
  CalendarDays,
  Dumbbell,
  FileText,
  KeyRound,
  LogOut,
  Moon,
  Sun,
  User,
  UserCog,
  Users,
  ChevronsUpDown,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AccountAvatar } from "@/components/account/account-avatar";
import Image from "next/image";

const SIDEBAR_COLLAPSED_KEY = "layered-sidebar-collapsed";

type MainNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, overrides default prefix matching for the active pill. */
  isActive?: (pathname: string) => boolean;
};

const navItems: MainNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/week-overview", label: "Week Overview", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/class-plans", label: "Class Plans", icon: FileText },
  { href: "/exercises", label: "Exercises Library", icon: Dumbbell },
  { href: "/clients", label: "Clients", icon: Users },
];

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: UserPlus },
];

function ThemeToggleMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <DropdownMenuItem disabled className="rounded-xl my-1.5">
        <Sun className="mr-2 size-4" />
        Theme
      </DropdownMenuItem>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenuItem
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-xl my-1.5"
    >
      {isDark ? (
        <>
          <Sun className="mr-2 size-4" />
          Light mode
        </>
      ) : (
        <>
          <Moon className="mr-2 size-4" />
          Dark mode
        </>
      )}
    </DropdownMenuItem>
  );
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const linkClassName = cn(
    "group flex items-center rounded-2xl text-sm font-medium transition-all",
    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-inner"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

  const iconClassName = cn(
    "size-4 shrink-0 transition-colors",
    active
      ? "text-sidebar-primary-foreground"
      : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
  );

  if (!collapsed) {
    return (
      <Link href={href} onClick={onNavigate} className={linkClassName}>
        <Icon className={iconClassName} />
        {label}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            onClick={onNavigate}
            aria-label={label}
            className={linkClassName}
          >
            <Icon className={iconClassName} />
          </Link>
        }
      />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { isAdmin, instructor, logout } = useAuth();

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        if (stored === "true") {
          setDesktopCollapsed(true);
        }
      } catch {
        // ignore storage errors
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggleDesktopCollapsed = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const isAccountActive = pathname === "/account";
  const isChangePasswordActive = pathname === "/account/password";

  const defaultIsActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavContent = (
    collapsed: boolean,
    { isMobileDrawer = false }: { isMobileDrawer?: boolean } = {},
  ) => (
    <nav
      className={cn(
        "flex h-full min-h-0 flex-col gap-1 py-4",
        collapsed ? "px-2" : "px-3",
      )}
    >
      <div
        className={cn(
          "mb-6 shrink-0 border-b border-sidebar-border p-2 py-4",
          collapsed && "px-0",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-2" : "justify-between gap-2",
          )}
        >
          <Link
            href="/"
            onClick={() => isMobileDrawer && setMobileOpen(false)}
            className={cn("cursor-pointer", collapsed && "flex justify-center")}
          >
            {collapsed ? (
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Layered."
                width={36}
                height={36}
                className="size-9 rounded-xl"
              />
            ) : (
              <Image
                src="/layered-logo.png"
                alt="Layered. Logo"
                width={607}
                height={115}
                style={{ width: 120, height: "auto" }}
              />
            )}
          </Link>
          {isMobileDrawer ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-xl text-muted-foreground hover:text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hidden shrink-0 rounded-xl text-muted-foreground hover:text-sidebar-foreground md:inline-flex"
              onClick={toggleDesktopCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {!isAdmin &&
          navItems.map((item) => (
            <SidebarNavLink
              key={`main-${item.label}`}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={
                item.isActive
                  ? item.isActive(pathname)
                  : defaultIsActive(item.href)
              }
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}

        {isAdmin && (
          <>
            {!collapsed && (
              <span className="mb-1 px-3 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Admin
              </span>
            )}
            {adminNavItems.map((item) => (
              <SidebarNavLink
                key={`admin-${item.label}`}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={defaultIsActive(item.href)}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-sidebar-border pt-3">
        <DropdownMenu>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "mx-auto flex size-10 items-center justify-center rounded-2xl p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    aria-label="Account menu"
                  >
                    <AccountAvatar
                      name={instructor?.name ?? "Account"}
                      image={instructor?.image}
                      className="size-9 shrink-0"
                    />
                  </DropdownMenuTrigger>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                Account
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-auto w-full justify-start gap-3 rounded-2xl px-3 py-2.5 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <AccountAvatar
                name={instructor?.name ?? "Account"}
                image={instructor?.image}
                className="size-9 shrink-0"
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">
                  {instructor?.name ?? "Account"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {instructor?.email}
                </p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
            </DropdownMenuTrigger>
          )}
          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "start"}
            className="w-64 rounded-2xl border border-border/60 bg-popover p-2 shadow-xl"
          >
            <div className="flex items-center gap-3 rounded-xl bg-accent/70 px-3 py-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-popover-foreground">
                  {instructor?.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {instructor?.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setMobileOpen(false);
                router.push("/account");
              }}
              className={cn(
                "rounded-xl my-1.5",
                isAccountActive && "bg-accent text-accent-foreground",
              )}
            >
              <UserCog className="mr-2 size-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setMobileOpen(false);
                router.push("/account/password");
              }}
              className={cn(
                "rounded-xl my-1.5",
                isChangePasswordActive && "bg-accent text-accent-foreground",
              )}
            >
              <KeyRound className="mr-2 size-4" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeToggleMenuItem />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logout();
                setMobileOpen(false);
                router.replace("/login");
              }}
              className="rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle — only when drawer is closed */}
      {!mobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — always full width with labels */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderNavContent(false, { isMobileDrawer: true })}
      </aside>

      {/* Desktop sidebar — user can collapse to icon rail */}
      <aside
        className={cn(
          "hidden h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out md:flex md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar md:text-sidebar-foreground",
          desktopCollapsed ? "md:w-18" : "md:w-72",
        )}
      >
        {renderNavContent(desktopCollapsed)}
      </aside>
    </>
  );
}
