import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuestionsListPage } from '@/pages/QuestionsListPage';
import { QuestionDetailPage } from '@/pages/QuestionDetailPage';
import { QuestionGeneratePage } from '@/pages/QuestionGeneratePage';
import { QuestionCreatePage } from '@/pages/QuestionCreatePage';
import { DailySetsPage } from '@/pages/DailySetsPage';
import { DailySetCreatePage } from '@/pages/DailySetCreatePage';
import { DailySetEditPage } from '@/pages/DailySetEditPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { ReferencePage } from '@/pages/ReferencePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionsListPage />} />
        <Route path="questions/generate" element={<QuestionGeneratePage />} />
        <Route path="questions/create" element={<QuestionCreatePage />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route path="daily-sets" element={<DailySetsPage />} />
        <Route path="daily-sets/create" element={<DailySetCreatePage />} />
        <Route path="daily-sets/:id/edit" element={<DailySetEditPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reference" element={<ReferencePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
