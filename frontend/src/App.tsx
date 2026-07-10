import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CommandPalette } from '@/components/CommandPalette';
import { Starfield } from '@/components/Starfield';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'));
const ResumesPage = lazy(() => import('@/pages/ResumesPage'));
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'));
const NetworkPage = lazy(() => import('@/pages/NetworkPage'));
const AIToolsPage = lazy(() => import('@/pages/AIToolsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const GoalsPage = lazy(() => import('@/pages/GoalsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));


/** Redirect authenticated users away from the auth pages. */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Marketing landing for visitors; straight into the app for users. */
function HomeGate() {
  const token = useAuthStore((s) => s.token);
  return token ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Global starfield — one instance behind the entire app */}
      <div className="fixed inset-0 -z-20" aria-hidden>
        <Starfield density={1} />
      </div>
      <div className="noise ambient fixed inset-0 -z-10 pointer-events-none" aria-hidden />

      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

        <Route
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CommandPalette />
                <AppLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/ai" element={<AIToolsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
