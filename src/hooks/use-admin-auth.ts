import { useState, useEffect, useCallback } from "react";

export type AdminRole = "owner" | "manager";

const SESSION_KEY = "pier12_admin_token";
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

export interface AdminSession {
  token: string;
  role: AdminRole;
  username: string;
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async (token: string): Promise<AdminSession | null> => {
    try {
      const res = await fetch(`${BASE_URL}/verify-admin-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
          "x-admin-token": token,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.valid) {
        return { token, role: data.role as AdminRole, username: data.username };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // On mount, check stored token
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    verify(stored).then((sess) => {
      setSession(sess);
      if (!sess) localStorage.removeItem(SESSION_KEY);
      setLoading(false);
    });
  }, [verify]);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Credenciais inválidas";
      const newSession: AdminSession = { token: data.token, role: data.role, username };
      localStorage.setItem(SESSION_KEY, data.token);
      setSession(newSession);
      return null;
    } catch {
      return "Erro de conexão. Tente novamente.";
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return { session, loading, login, logout };
}
