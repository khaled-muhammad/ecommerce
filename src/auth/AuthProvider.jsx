import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext.js";
import { apiUrl } from "../lib/apiUrl.js";

const ACCESS_STORAGE_KEY = "roxy_access_token";

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAccessToken = useCallback(() => sessionStorage.getItem(ACCESS_STORAGE_KEY), []);

  const setAccessToken = useCallback((token) => {
    if (token) sessionStorage.setItem(ACCESS_STORAGE_KEY, token);
    else sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  }, []);

  const fetchMe = useCallback(async (token) => {
    const res = await fetch(apiUrl("/api/v1/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await parseJsonSafe(res);
    return data?.user ?? null;
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const res = await fetch(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await parseJsonSafe(res);
    const at = data?.accessToken;
    if (typeof at === "string" && at) {
      setAccessToken(at);
      return at;
    }
    return null;
  }, [setAccessToken]);

  const applySession = useCallback(
    async (accessToken, nextUser) => {
      setAccessToken(accessToken);
      if (nextUser) {
        setUser(nextUser);
        return;
      }
      const u = await fetchMe(accessToken);
      setUser(u);
    },
    [fetchMe, setAccessToken],
  );

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        let token = getAccessToken();
        let u = null;
        if (token) {
          u = await fetchMe(token);
          if (ac.signal.aborted) return;
          if (!u) {
            const next = await refreshAccessToken();
            if (ac.signal.aborted) return;
            if (next) u = await fetchMe(next);
          }
          if (ac.signal.aborted) return;
          setUser(u);
          if (!u) setAccessToken(null);
        } else {
          const next = await refreshAccessToken();
          if (ac.signal.aborted) return;
          if (next) {
            u = await fetchMe(next);
            if (ac.signal.aborted) return;
            setUser(u);
            if (!u) setAccessToken(null);
          }
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [fetchMe, getAccessToken, refreshAccessToken, setAccessToken]);

  const login = useCallback(
    async (email, password) => {
      const res = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        const msg = data?.message ?? data?.error ?? "Sign in failed";
        throw new Error(msg);
      }
      await applySession(data.accessToken, data.user);
    },
    [applySession],
  );

  const register = useCallback(
    async ({ email, password, name }) => {
      const res = await fetch(apiUrl("/api/v1/auth/register"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name ?? "" }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        const msg = data?.message ?? data?.error ?? "Could not create account";
        throw new Error(msg);
      }
      await applySession(data.accessToken, data.user);
      return { adminBootstrap: Boolean(data?.adminBootstrap) };
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* still clear client */
    }
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const authorizedFetch = useCallback(
    async (path, init = {}) => {
      const run = (token) => {
        const headers = new Headers(init.headers);
        if (
          init.body != null &&
          !(init.body instanceof FormData) &&
          !headers.has("Content-Type")
        ) {
          headers.set("Content-Type", "application/json");
        }
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(apiUrl(path), { ...init, credentials: "include", headers });
      };
      let token = getAccessToken();
      if (!token) throw new Error("Not signed in");
      let res = await run(token);
      if (res.status === 401) {
        const next = await refreshAccessToken();
        if (!next) throw new Error("Session expired");
        res = await run(next);
      }
      return res;
    },
    [getAccessToken, refreshAccessToken],
  );

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const consumeOAuthAccessToken = useCallback(
    async (accessToken) => {
      if (!accessToken) return;
      await applySession(accessToken, null);
    },
    [applySession],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      getAccessToken,
      refreshAccessToken,
      consumeOAuthAccessToken,
      refetchUser: async () => {
        const t = getAccessToken();
        if (!t) return;
        const u = await fetchMe(t);
        setUser(u);
      },
      authorizedFetch,
      updateUser,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      getAccessToken,
      refreshAccessToken,
      consumeOAuthAccessToken,
      fetchMe,
      authorizedFetch,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
