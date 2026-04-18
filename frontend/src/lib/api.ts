// ============================================================
// API CLIENT — Axios instance with auth interceptors
// ============================================================

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('gc_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear auth state and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gc_token');
      localStorage.removeItem('gc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const extract = <T>(res: { data: ApiResponse<T> }): T => {
  if (!res.data.success) throw new Error(res.data.error ?? 'Request failed');
  return res.data.data as T;
};

// AUTH
export const authApi = {
  signup: (email: string, password: string, fullName: string) =>
    api.post<ApiResponse<{ user: unknown; accessToken: string }>>('/auth/signup', { email, password, fullName }).then(extract),
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: unknown; accessToken: string }>>('/auth/login', { email, password }).then(extract),
  me: () => api.get<ApiResponse<unknown>>('/auth/me').then(extract),
};

// SCORES
export const scoreApi = {
  add: (score: number, playedAt: string) =>
    api.post<ApiResponse<unknown>>('/scores', { score, playedAt }).then(extract),
  getAll: () => api.get<ApiResponse<unknown[]>>('/scores').then(extract),
};

// SUBSCRIPTIONS
export const subscriptionApi = {
  getStatus: () => api.get<ApiResponse<unknown>>('/subscription').then(extract),
  checkout: (plan: 'monthly' | 'yearly') =>
    api.post<ApiResponse<{ checkoutUrl: string }>>('/subscription/checkout', { plan }).then(extract),
  cancel: () => api.post<ApiResponse<unknown>>('/subscription/cancel').then(extract),
};

// CHARITIES
export const charityApi = {
  list: (search?: string) =>
    api.get<ApiResponse<unknown[]>>('/charities', { params: search ? { search } : {} }).then(extract),
  featured: () => api.get<ApiResponse<unknown[]>>('/charities/featured').then(extract),
  getById: (id: string) => api.get<ApiResponse<unknown>>(`/charities/${id}`).then(extract),
  create: (data: unknown) => api.post<ApiResponse<unknown>>('/charities', data).then(extract),
  update: (id: string, data: unknown) => api.put<ApiResponse<unknown>>(`/charities/${id}`, data).then(extract),
  delete: (id: string) => api.delete<ApiResponse<unknown>>(`/charities/${id}`).then(extract),
};

// DRAWS
export const drawApi = {
  latest: () => api.get<ApiResponse<unknown>>('/draw/latest').then(extract),
  all: () => api.get<ApiResponse<unknown[]>>('/draw').then(extract),
  create: (drawType: string, month?: string) =>
    api.post<ApiResponse<unknown>>('/draw', { drawType, month }).then(extract),
  simulate: (id: string) => api.post<ApiResponse<unknown>>(`/draw/${id}/simulate`).then(extract),
  run: (id: string) => api.post<ApiResponse<unknown>>(`/draw/${id}/run`).then(extract),
  publish: (id: string) => api.post<ApiResponse<unknown>>(`/draw/${id}/publish`).then(extract),
  results: (id: string) => api.get<ApiResponse<unknown[]>>(`/draw/${id}/results`).then(extract),
  myEntry: (id: string) => api.get<ApiResponse<unknown>>(`/draw/${id}/my-entry`).then(extract),
};

// WINNERS
export const winnerApi = {
  myVerifications: () => api.get<ApiResponse<unknown[]>>('/winners/my').then(extract),
  allVerifications: () => api.get<ApiResponse<unknown[]>>('/admin/winners').then(extract),
  review: (id: string, status: 'approved' | 'rejected') =>
    api.patch<ApiResponse<unknown>>(`/admin/winners/${id}/review`, { status }).then(extract),
  markPaid: (id: string) => api.patch<ApiResponse<unknown>>(`/admin/winners/${id}/pay`).then(extract),
};

// ADMIN
export const adminApi = {
  analytics: () => api.get<ApiResponse<unknown>>('/admin/analytics').then(extract),
};
