"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  UserCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/auth-context";
import { AccountAvatar } from "@/components/account/account-avatar";
import { AccountPageShell } from "@/components/account/account-page-shell";
import { PlatformSettingsSection } from "@/components/account/platform-settings-section";
import { ProfilePhotoUpload } from "@/components/account/profile-photo-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  buildProfileFormDefaults,
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validation/profile-schemas";
import { cn } from "@/lib/utils";

function roleLabel(role: string) {
  return role === "ADMIN" ? "Administrator" : "Instructor";
}

export function AccountSettingsView() {
  const router = useRouter();
  const { instructor, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: instructor ? buildProfileFormDefaults(instructor) : { name: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (!instructor) return;
    const t = setTimeout(() => reset(buildProfileFormDefaults(instructor)), 0);
    return () => clearTimeout(t);
  }, [instructor, reset]);

  useEffect(() => {
    if (!instructor) return;
    setAvatarPreview(instructor.image?.trim() || null);
    setAvatarVersion(0);
  }, [instructor?.id]);

  useEffect(() => {
    if (!isAdmin || typeof window === "undefined") return;
    if (window.location.hash !== "#platform-settings") return;
    const t = setTimeout(() => {
      document
        .getElementById("platform-settings")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(t);
  }, [isAdmin, instructor?.id]);

  if (!instructor) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center rounded-3xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-3 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          Loading account settings
        </div>
      </div>
    );
  }

  const previewName = watchedName?.trim() || instructor.name;
  const displayAvatar = avatarPreview;

  const handleAvatarChange = (url: string | null) => {
    setAvatarPreview(url);
    if (url) setAvatarVersion((v) => v + 1);
    else setAvatarVersion(0);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const { error } = await authClient.updateUser({
        name: values.name.trim(),
      });
      if (error) {
        toast.error(error.message ?? "Could not update account");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Could not update account");
    } finally {
      setSaving(false);
    }
  });

  return (
    <AccountPageShell
      title="Account settings"
      description={
        isAdmin
          ? "Update your profile, platform settings, and sign-in options."
          : "Update your profile and manage how you sign in to Layered."
      }
      backHref="/"
      backLabel="Back to dashboard"
    >
      <div className="rounded-3xl border border-border bg-card px-4 py-5 shadow-lg md:px-6 md:py-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Signed in as
        </p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <AccountAvatar
            name={previewName}
            image={displayAvatar}
            imageVersion={avatarVersion}
            className="size-16 shrink-0 shadow-sm ring-2 ring-border"
            fallbackClassName="text-base"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading truncate text-xl font-semibold tracking-[-0.02em]">
                {previewName}
              </h2>
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="rounded-full"
              >
                {roleLabel(instructor.role)}
              </Badge>
            </div>
            <p className="mt-1.5 inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{instructor.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <section className="w-full rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCircle className="size-4.5" aria-hidden />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                Profile
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                How your name and photo appear in the sidebar and across the app.
              </p>
            </div>
          </div>

          <form noValidate onSubmit={onSubmit} className="mt-6 space-y-5">
            <ProfilePhotoUpload
              name={previewName}
              avatarUrl={displayAvatar}
              imageVersion={avatarVersion}
              onAvatarChange={handleAvatarChange}
            />

            <div className="space-y-2">
              <Label htmlFor="account-name">
                Display name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-name"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={errors.name ? true : undefined}
                className={cn(errors.name && "border-destructive")}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <Separator />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {isDirty ? "Unsaved name changes" : "Photo saves automatically"}
              </p>
              <Button
                type="submit"
                className="rounded-full"
                disabled={saving || !isDirty}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save name"
                )}
              </Button>
            </div>
          </form>
        </section>

        {!isAdmin ? (
          <section className="w-full rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-4.5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                  Sign-in email
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Set when you registered or accepted an invitation. It cannot be changed
                  in the app.
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="account-email"
                type="email"
                readOnly
                value={instructor.email}
                className="cursor-default pl-9"
                aria-readonly
              />
            </div>
          </section>
        ) : null}

        {isAdmin ? <PlatformSettingsSection /> : null}

        <section className="w-full rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="size-4.5" aria-hidden />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                  Security
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Keep your account protected with a strong password.
                </p>
              </div>
            </div>

            <Link
              href="/account/password"
              className={cn(
                "group mt-5 flex items-center gap-4 rounded-2xl border border-border p-4 transition-all",
                "hover:-translate-y-px hover:border-ring/40 hover:shadow-md",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Change password</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Update password and sign out other devices
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
        </section>
      </div>
    </AccountPageShell>
  );
}
