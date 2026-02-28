import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/Skeleton';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const QuestionsListPage = lazy(() => import('@/pages/QuestionsListPage').then((m) => ({ default: m.QuestionsListPage })));
const QuestionDetailPage = lazy(() => import('@/pages/QuestionDetailPage').then((m) => ({ default: m.QuestionDetailPage })));
const QuestionGeneratePage = lazy(() => import('@/pages/QuestionGeneratePage').then((m) => ({ default: m.QuestionGeneratePage })));
const QuestionCreatePage = lazy(() => import('@/pages/QuestionCreatePage').then((m) => ({ default: m.QuestionCreatePage })));
const DailySetsPage = lazy(() => import('@/pages/DailySetsPage').then((m) => ({ default: m.DailySetsPage })));
const DailySetCreatePage = lazy(() => import('@/pages/DailySetCreatePage').then((m) => ({ default: m.DailySetCreatePage })));
const DailySetEditPage = lazy(() => import('@/pages/DailySetEditPage').then((m) => ({ default: m.DailySetEditPage })));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })));
const ReferencePage = lazy(() => import('@/pages/ReferencePage').then((m) => ({ default: m.ReferencePage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-64 mb-6" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<PageFallback />}><LoginPage /></Suspense>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
        <Route path="questions" element={<Suspense fallback={<PageFallback />}><QuestionsListPage /></Suspense>} />
        <Route path="questions/generate" element={<Suspense fallback={<PageFallback />}><QuestionGeneratePage /></Suspense>} />
        <Route path="questions/create" element={<Suspense fallback={<PageFallback />}><QuestionCreatePage /></Suspense>} />
        <Route path="questions/:id" element={<Suspense fallback={<PageFallback />}><QuestionDetailPage /></Suspense>} />
        <Route path="daily-sets" element={<Suspense fallback={<PageFallback />}><DailySetsPage /></Suspense>} />
        <Route path="daily-sets/create" element={<Suspense fallback={<PageFallback />}><DailySetCreatePage /></Suspense>} />
        <Route path="daily-sets/:id/edit" element={<Suspense fallback={<PageFallback />}><DailySetEditPage /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<PageFallback />}><CategoriesPage /></Suspense>} />
        <Route path="collections" element={<Suspense fallback={<PageFallback />}><CollectionsPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense>} />
        <Route path="reference" element={<Suspense fallback={<PageFallback />}><ReferencePage /></Suspense>} />
      </Route>
      <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}
