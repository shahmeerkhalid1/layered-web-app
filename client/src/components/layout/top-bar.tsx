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

  const initials = instructor?.name
    ? instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-4 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "relative h-8 w-8 rounded-full"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <User className="size-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{instructor?.name}</span>
              <span className="text-xs text-muted-foreground">
                {instructor?.email}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => { await logout(); router.replace("/login"); }} className="text-destructive">
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
