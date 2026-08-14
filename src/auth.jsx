import { createContext, useContext, useEffect, useState } from "react";
import { API } from "./api";

const TOKEN_KEY = "ascendant_auth_token";

const AuthContext = createContext({
  user: null,
  loading: true,
  loginUrl: `${API}/auth/discord`,
  logout: async () => {},
});

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Capture Obscura-style auth_token from the OAuth redirect onto the homepage
    try {
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get("auth_token");
      if (authToken) {
        setAuthToken(authToken);
        params.delete("auth_token");
        const next = params.toString();
        const clean = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash || ""}`;
        window.history.replaceState({}, "", clean || "/");
      }
    } catch {}
    refresh();
  }, []);

  async function logout() {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: (() => {
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      })(),
    }).catch(() => {});
    setAuthToken("");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUrl: `${API}/auth/discord`, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
