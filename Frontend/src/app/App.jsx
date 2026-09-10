import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/routing/PublicOnlyRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { SubmitPage } from '@/pages/student/SubmitPage'
import { ResultsPage } from '@/pages/student/ResultsPage'
import { SubmissionDetailPage } from '@/pages/student/SubmissionDetailPage'
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard'
import { SubmissionsPage } from '@/pages/teacher/SubmissionsPage'
import { AiEvaluationPage } from '@/pages/teacher/AiEvaluationPage'


import { ReviewSubmissionPage } from '@/pages/teacher/ReviewSubmissionPage'
import { TeacherEvaluatePage } from '@/pages/teacher/TeacherEvaluatePage'
import { StudentsPage } from '@/pages/teacher/StudentsPage'
import { ReportsPage } from '@/pages/teacher/ReportsPage'
import { AnalyticsPage } from '@/pages/teacher/AnalyticsPage'
import { HistoryPage } from '@/pages/student/HistoryPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Spinner } from '@/components/feedback/Spinner'
import { useAuth } from '@/hooks/useAuth'

function roleHome(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}

/**
 * Authentication-first landing. No JWT -> /auth/login. Signed in -> their
 * role dashboard. This is what the bare "/" resolves to.
 */
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth/login" replace />
  return <Navigate to={roleHome(user.role)} replace />
}

/**
 * EvalAI — authentication-first router.
 * / redirects by session state. The AI evaluation studio is teacher-only at
 * /teacher/evaluate/:submissionId; every workspace sits behind JWT + role
 * protection.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/evaluation',
    element: <RootRedirect />,
  },

  // Public auth pages — signed-in users are bounced to their dashboard.
  {
    element: (
      <PublicOnlyRoute>
        <Outlet />
      </PublicOnlyRoute>
    ),
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // Student workspace.
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute roles={['student']} />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/student/dashboard', element: <StudentDashboard /> },
          { path: '/student/submit', element: <SubmitPage /> },
          { path: '/student/results', element: <ResultsPage /> },
          { path: '/student/results/submission/:id', element: <SubmissionDetailPage /> },
          { path: '/student/history', element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Teacher workspace.
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute roles={['teacher']} />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/teacher/dashboard', element: <TeacherDashboard /> },
          { path: '/teacher/submissions', element: <SubmissionsPage /> },
          { path: '/teacher/submission/:id', element: <ReviewSubmissionPage /> },
          { path: '/teacher/ai-evaluation', element: <AiEvaluationPage /> },
         
         
          { path: '/teacher/evaluation/:submissionId', element: <TeacherEvaluatePage /> },
          { path: '/teacher/evaluate/:submissionId', element: <TeacherEvaluatePage /> },
          { path: '/teacher/students', element: <StudentsPage /> },
          { path: '/teacher/reports', element: <ReportsPage /> },
          { path: '/teacher/analytics', element: <AnalyticsPage /> },
        ],
      },
    ],
  },

  // Admin workspace.
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute roles={['admin']} />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <DashboardLayout />,
        children: [{ path: '/admin/dashboard', element: <AdminDashboard /> }],
      },
    ],
  },

  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App