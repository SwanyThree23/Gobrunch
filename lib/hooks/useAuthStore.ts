import { create } from 'zustand';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (auth: AuthResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (auth: AuthResponse) =>
    set({
      user: auth.user,
      token: auth.token,
      refreshToken: auth.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setUser: (user: User) => set({ user }),

  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
