"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth-schemas";

interface InviteInfo {
  email: string;
  role: string;
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const { register: signUp, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [pageError, setPageError] = useState("");
  const [signupAllowed, setSignupAllowed] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        if (token) {
          const data = await api.get<InviteInfo>(`/invite/verify?token=${token}`);
          setInvite(data);
          setValue("email", data.email, { shouldValidate: true });
          setSignupAllowed(true);
        } else {
          const data = await api.get<{ signupEnabled: boolean }>("/signup-status");
          setSignupAllowed(data.signupEnabled);
        }
      } catch {
        if (token) {
          setPageError("Invalid or expired invitation link.");
        }
        setSignupAllowed(false);
      } finally {
        setChecking(false);
      }
    }
    checkAccess();
  }, [token, setValue]);

  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!signupAllowed && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Registration Closed</CardTitle>
            <CardDescription>
              {pageError ||
                "Public registration is currently disabled. Please contact an administrator for an invitation."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setPageError("");
    try {
      await signUp(values.email, values.password, values.name);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Registration failed");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {invite
              ? "You've been invited to join Pilates Platform"
              : "Get started with Pilates Platform"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {pageError && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {pageError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                readOnly={!!invite}
                aria-invalid={errors.email ? true : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
