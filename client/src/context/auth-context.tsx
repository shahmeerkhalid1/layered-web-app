"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";

interface Instructor {
  id: string;
  email: string;
  name: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  instructor: Instructor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user as
    | {
        id: string;
        email: string;
        name: string;
        role?: string;
        image?: string | null;
        emailVerified?: boolean;
      }
    | undefined;

  const instructor: Instructor | null = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ?? "INSTRUCTOR",
        image: user.image?.trim() || null,
        emailVerified: user.emailVerified === true,
      }
    : null;

  const isAdmin = instructor?.role === "ADMIN";
  const isEmailVerified = instructor?.emailVerified ?? false;

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const { error } = await authClient.signIn.email({ email, password, rememberMe });
    if (error) {
      const authError = error as { message?: string; status?: number };
      const err = new Error(authError.message ?? "Login failed") as Error & { status?: number };
      err.status = authError.status;
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: getAuthCallbackUrl("/"),
    });
    if (error) {
      throw new Error(error.message ?? "Registration failed");
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: getAuthCallbackUrl("/"),
    });
    if (error) {
      const authError = error as { message?: string; status?: number };
      const err = new Error(authError.message ?? "Could not send verification email") as Error & {
        status?: number;
      };
      err.status = authError.status;
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        instructor,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
        isEmailVerified,
        isAdmin,
        login,
        register,
        resendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
