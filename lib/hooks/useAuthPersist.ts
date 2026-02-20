'use client';

import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { authApi, ApiError } from '@/lib/api';

/**
 * Hook that restores auth state from localStorage on mount
 * and syncs token to cookies for middleware access.
 */
export function useAuthPersist() {
  const { setAuth, setUser, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token || isAuthenticated) return;

    // Try to restore session
    authApi
      .getSession()
      .then((user) => {
        setAuth({ user, token, refreshToken: refreshToken || '' });
        // Sync token to cookie for middleware
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
      })
      .catch((err) => {
        if (err instanceof ApiError && err.statusCode === 401) {
          // Token expired — clear everything
          logout();
          authApi.logout();
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
      });
  }, [setAuth, setUser, logout, isAuthenticated]);
}
