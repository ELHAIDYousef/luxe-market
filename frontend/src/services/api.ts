/**
 * LuxeMarket API client
 * ─────────────────────
 * - Attaches JWT access token to every request
 * - On 401: attempts one silent refresh before redirecting to login
 * - Queues concurrent requests during a refresh to avoid multiple refresh calls
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY   = 'lx_token';
const REFRESH_KEY = 'lx_refresh';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle 401 with silent refresh ─────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(newToken: string) {
  refreshQueue.forEach(resolve => resolve(newToken));
  refreshQueue = [];
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 and if we haven't retried yet
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't retry the refresh endpoint itself
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      _redirectToLogin();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      _redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise(resolve => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const newToken = data.access_token;
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      _redirectToLogin();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

function _redirectToLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

export default api;
