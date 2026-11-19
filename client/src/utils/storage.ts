import { Restaurant, User } from "../types";

const KEYS = {
  accessToken: "gather.accessToken",
  refreshToken: "gather.refreshToken",
  user: "gather.user",
  restaurant: "gather.restaurant",
} as const;

function getJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export const storage = {
  getAccessToken: () => localStorage.getItem(KEYS.accessToken),
  setAccessToken: (token: string) => localStorage.setItem(KEYS.accessToken, token),
  getRefreshToken: () => localStorage.getItem(KEYS.refreshToken),
  setRefreshToken: (token: string) => localStorage.setItem(KEYS.refreshToken, token),
  getUser: () => getJson<User>(KEYS.user),
  setUser: (user: User) => localStorage.setItem(KEYS.user, JSON.stringify(user)),
  getRestaurant: () => getJson<Restaurant>(KEYS.restaurant),
  setRestaurant: (restaurant: Restaurant) =>
    localStorage.setItem(KEYS.restaurant, JSON.stringify(restaurant)),
  clearSession: () => Object.values(KEYS).forEach((key) => localStorage.removeItem(key)),
};
