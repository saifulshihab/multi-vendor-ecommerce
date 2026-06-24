"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { api, unwrap } from "./api";
import { tokenStore } from "./token-store";
import type { AuthUser, Role } from "./types";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

interface SignupInput {
  email: string;
  password: string;
  name: string;
  role: Extract<Role, "BUYER" | "SELLER">;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSession: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const fetchMe = useCallback(async () => {
    const me = await unwrap<AuthUser>(api.get("/auth/me"));
    setUser(me);
    setStatus("authenticated");
  }, []);

  // Bootstrap: try the in-memory token, otherwise let the refresh cookie restore.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await fetchMe();
      } catch {
        if (active) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await unwrap<AuthResponse>(
      api.post("/auth/login", { email, password }),
    );
    tokenStore.set(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
    return res.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const res = await unwrap<AuthResponse>(api.post("/auth/signup", input));
    tokenStore.set(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      await fetchMe();
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, [fetchMe]);

  const setSession = useCallback(
    async (token: string) => {
      tokenStore.set(token);
      await refreshUser();
    },
    [refreshUser],
  );

  return (
    <AuthContext.Provider
      value={{ user, status, login, signup, logout, refreshUser, setSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
