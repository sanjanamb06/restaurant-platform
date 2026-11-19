import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiResponse } from "../types";
import { storage } from "../utils/storage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshRequest: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const accessToken = storage.getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const refreshToken = storage.getRefreshToken();
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
    const isPublicAuthRequest = ["/auth/login", "/auth/register-restaurant"].some((path) =>
      originalRequest?.url?.includes(path),
    );

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isPublicAuthRequest
    ) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      storage.clearSession();
      window.location.assign("/login");
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= axios
        .post<ApiResponse<{ accessToken: string }>>(`${baseURL}/auth/refresh`, { refreshToken })
        .then((response) => response.data.data.accessToken)
        .finally(() => {
          refreshRequest = null;
        });

      const accessToken = await refreshRequest;
      storage.setAccessToken(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      storage.clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  },
);

export default api;
