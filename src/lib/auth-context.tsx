// lib/auth-context.tsx — React context for user auth state

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  language: string;
  region: string;
  timezone: string;
  aiThreshold: number;
  aiAutoApply: boolean;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("easyepg_token");
    const storedUser = sessionStorage.getItem("easyepg_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    sessionStorage.setItem("easyepg_token", newToken);
    sessionStorage.setItem("easyepg_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("easyepg_token");
    sessionStorage.removeItem("easyepg_user");
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const stored = sessionStorage.getItem("easyepg_token");
    if (!stored) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${stored}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        sessionStorage.setItem("easyepg_user", JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
