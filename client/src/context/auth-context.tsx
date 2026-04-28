"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";

interface Instructor {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  instructor: Instructor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user as
    | { id: string; email: string; name: string; role?: string }
    | undefined;

  const instructor: Instructor | null = user
    ? { id: user.id, email: user.email, name: user.name, role: user.role ?? "INSTRUCTOR" }
    : null;

  const isAdmin = instructor?.role === "ADMIN";

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      throw new Error(error.message ?? "Login failed");
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await authClient.signUp.email({ email, password, name });
    if (error) {
      throw new Error(error.message ?? "Registration failed");
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
        isAdmin,
        login,
        register,
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
