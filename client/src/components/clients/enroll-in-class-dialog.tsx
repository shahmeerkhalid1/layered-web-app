"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clientApi } from "@/services/client-api";
import { schedulingApi } from "@/services/scheduling-api";
import type { ScheduledClass } from "@/lib/types";

interface EnrollInClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  enrolledClassIds: Set<string>;
  onEnrolled: () => void;
}

export function EnrollInClassDialog({
  open,
  onOpenChange,
  clientId,
  enrolledClassIds,
  onEnrolled,
}: EnrollInClassDialogProps) {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      void (async () => {
        try {
          const result = await schedulingApi.listClasses({
            page: 1,
            limit: 100,
            upcoming: true,
          });
          if (!cancelled) setClasses(result.data);
        } catch {
          if (!cancelled) toast.error("Failed to load classes");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (enrolledClassIds.has(c.id)) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [classes, enrolledClassIds, search]);

  async function handleEnroll(classId: string) {
    setPending(true);
    try {
      await clientApi.enrollClient(classId, clientId);
      toast.success("Client enrolled");
      onEnrolled();
      onOpenChange(false);
      setSearch("");
    } catch {
      toast.error("Failed to enroll client");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,40rem)] w-full flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 pt-6 pr-12 pb-4 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            Enroll in class
          </DialogTitle>
          <DialogDescription>
            Choose a scheduled class series to add this client to the roster.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative shrink-0 border-b border-border/60 px-6 py-4">
            <Search className="absolute top-1/2 left-9 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-border bg-background max-w-[96%]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {classes.length === 0
                    ? "No upcoming classes scheduled yet."
                    : "No matching upcoming classes or client is already enrolled."}
                </p>
              ) : (
                filtered.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/10 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{cls.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {cls.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {cls.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 rounded-full"
                      disabled={pending}
                      onClick={() => void handleEnroll(cls.id)}
                    >
                      <UserPlus className="mr-1.5 size-3.5" />
                      Enroll
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
