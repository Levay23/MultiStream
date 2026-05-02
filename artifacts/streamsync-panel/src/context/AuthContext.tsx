import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "reseller" | "client";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("streamsync_token");
    if (stored) {
      setToken(stored);
    }
    setAuthTokenGetter(() => localStorage.getItem("streamsync_token"));
    setIsLoading(false);
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    localStorage.setItem("streamsync_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("streamsync_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
