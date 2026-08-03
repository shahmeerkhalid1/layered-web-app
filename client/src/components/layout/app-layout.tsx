"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageBackgroundContent } from "./page-background";
import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider delay={300}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <PageBackgroundContent className="mx-auto w-full max-w-[1200px] px-4 py-8 pt-14 md:px-14 md:py-10 md:pt-10">
              {children}
            </PageBackgroundContent>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
