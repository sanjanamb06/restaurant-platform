import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../api/auth.api";
import { LoginInput, Restaurant, User } from "../types";
import { storage } from "../utils/storage";

interface AuthContextValue {
  user: User | null;
  restaurant: Restaurant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
  markPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [restaurant, setRestaurant] = useState<Restaurant | null>(() => storage.getRestaurant());
  const [isLoading, setIsLoading] = useState(Boolean(storage.getRefreshToken()));

  const clearSession = useCallback(() => {
    storage.clearSession();
    setUser(null);
    setRestaurant(null);
  }, []);

  useEffect(() => {
    if (!storage.getRefreshToken()) {
      setIsLoading(false);
      return;
    }

    let active = true;
    authApi
      .getMe()
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setRestaurant(session.restaurant);
        storage.setUser(session.user);
        storage.setRestaurant(session.restaurant);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (input: LoginInput) => {
    const session = await authApi.login(input);
    storage.setAccessToken(session.accessToken);
    storage.setRefreshToken(session.refreshToken);
    storage.setUser(session.user);
    storage.setRestaurant(session.restaurant);
    setUser(session.user);
    setRestaurant(session.restaurant);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = storage.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const markPasswordChanged = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, mustChangePassword: false };
      storage.setUser(updated);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      restaurant,
      isAuthenticated: Boolean(user && storage.getAccessToken()),
      isLoading,
      login,
      logout,
      markPasswordChanged,
    }),
    [isLoading, login, logout, markPasswordChanged, restaurant, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
