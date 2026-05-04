"use client";

import { useAuth } from "@/context/auth-context";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { instructor, logout } = useAuth();
  const router = useRouter();
  const firstName = instructor?.name?.split(" ")[0] ?? "there";

  const initials = instructor?.name
    ? instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <div className="ml-11 md:ml-0">
        <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Studio Flow
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          Welcome, {firstName}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "relative h-10 w-10 rounded-full bg-accent p-1 text-accent-foreground shadow-inner hover:bg-accent/80"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-2xl border-border bg-popover p-2 shadow-xl"
        >
          <div className="flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
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
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
