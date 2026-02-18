import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layouts/AppLayout';

// Lazy load pages for code splitting
const LoginForm = lazy(() => import('@/components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
const SignupForm = lazy(() => import('@/components/auth/SignupForm').then(m => ({ default: m.SignupForm })));
const ForgotPasswordForm = lazy(() => import('@/components/auth/ForgotPasswordForm').then(m => ({ default: m.ForgotPasswordForm })));
const Dashboard = lazy(() => import('@/components/features/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('@/components/features/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('@/components/features/Settings').then(m => ({ default: m.Settings })));
const WalletDashboard = lazy(() => import('@/components/monetization/WalletDashboard').then(m => ({ default: m.WalletDashboard })));
const VirtualGoodsShop = lazy(() => import('@/components/monetization/VirtualGoodsShop').then(m => ({ default: m.VirtualGoodsShop })));
const ModerationDashboard = lazy(() => import('@/components/moderation/ModerationDashboard').then(m => ({ default: m.ModerationDashboard })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/wallet" element={<WalletDashboard />} />
                        <Route path="/shop" element={<VirtualGoodsShop />} />
                        <Route path="/moderation" element={<ModerationDashboard />} />
                        <Route path="/communities" element={<Dashboard />} />
                        <Route path="/rooms" element={<Dashboard />} />
                        <Route path="/rooms/:id" element={<Dashboard />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
