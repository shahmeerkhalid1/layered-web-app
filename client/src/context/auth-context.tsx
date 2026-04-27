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
}

interface AuthContextType {
  instructor: Instructor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const instructor: Instructor | null = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name }
    : null;

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
