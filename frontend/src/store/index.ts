// ============================================================
// AUTH STORE — Zustand with persistence
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'subscriber' | 'admin';
  charityId?: string;
  charityPercentage: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('gc_token', token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('gc_token');
        localStorage.removeItem('gc_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'gc_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ============================================================
// UI STORE — global loading, modals
// ============================================================

interface UIState {
  globalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),
}));
