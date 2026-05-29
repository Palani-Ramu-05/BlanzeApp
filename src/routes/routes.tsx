import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { FullPageLoader } from '@components/index'
import { ProtectedRoute } from '@core/middleware/ProtectedRoute'
import { GuestRoute } from '@core/middleware/GuestRoute'
import { HomeLayout } from '@core/layouts/HomeLayout'
import { AuthLayout } from '@modules/auth/index'
import { ErrorBoundary } from '@core/layouts/ErrorBoundary'

// Lazy-loaded pages
const SignInPage = lazy(() =>
  import('@modules/auth/pages/signin/SignInPage').then((m) => ({ default: m.SignInPage })),
)
const SignUpPage = lazy(() =>
  import('@modules/auth/pages/signup/SignUpPage').then((m) => ({ default: m.SignUpPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@modules/auth/pages/forgot-password/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const DashboardPage = lazy(() =>
  import('@modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const FetchLabPage = lazy(() =>
  import('@modules/fetchlab/pages/FetchLabPage').then((m) => ({ default: m.FetchLabPage })),
)
const VaultDropPage = lazy(() =>
  import('@modules/vaultdrop/pages/VaultDropPage').then((m) => ({ default: m.VaultDropPage })),
)
const DevToolsPage = lazy(() =>
  import('@modules/devtools/pages/DevToolsPage').then((m) => ({ default: m.DevToolsPage })),
)
const TimerPage = lazy(() =>
  import('@modules/timer/pages/TimerPage').then((m) => ({ default: m.TimerPage })),
)
const TaskBoardPage = lazy(() =>
  import('@modules/taskboard/pages/TaskBoardPage').then((m) => ({ default: m.TaskBoardPage })),
)
const NotesPage = lazy(() =>
  import('@modules/notes/pages/NotesPage').then((m) => ({ default: m.NotesPage })),
)

const withSuspense = (component: React.ReactNode) => (
  <Suspense fallback={<FullPageLoader />}>
    <ErrorBoundary>{component}</ErrorBoundary>
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Navigate to="/signin" replace />,
  },

  // Auth routes (guest only)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/auth/signin', element: withSuspense(<SignInPage />) },
          { path: '/auth/signup', element: withSuspense(<SignUpPage />) },
          { path: '/auth/forgot-password', element: withSuspense(<ForgotPasswordPage />) },
        ],
      },
    ],
  },

  // Protected dashboard routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <HomeLayout />,
        children: [
          { path: '/', element: withSuspense(<DashboardPage />) },
          { path: '/fetchlab', element: withSuspense(<FetchLabPage />) },
          { path: '/vaultdrop', element: withSuspense(<VaultDropPage />) },
          { path: '/devtools', element: withSuspense(<DevToolsPage />) },
          { path: '/timer', element: withSuspense(<TimerPage />) },
          { path: '/task-board', element: withSuspense(<TaskBoardPage />) },
          { path: '/notes', element: withSuspense(<NotesPage />) },
          {
            path: '/analytics',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Analytics — Coming Soon</div>,
            ),
          },
          {
            path: '/users',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Users — Coming Soon</div>,
            ),
          },
          {
            path: '/packages',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Packages — Coming Soon</div>,
            ),
          },
          {
            path: '/security',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Security — Coming Soon</div>,
            ),
          },
          {
            path: '/notifications',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Notifications — Coming Soon</div>,
            ),
          },
          {
            path: '/settings',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Settings — Coming Soon</div>,
            ),
          },
          {
            path: '/help',
            element: withSuspense(
              <div className="p-6 text-surface-400 text-sm">Help — Coming Soon</div>,
            ),
          },
        ],
      },
    ],
  },

  // 404 fallback
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center text-center">
        <div>
          <p className="text-6xl font-black text-surface-700 mb-3">404</p>
          <p className="text-white font-bold mb-2">Page not found</p>
          <a href="/" className="text-brand-400 text-sm hover:underline">
            Go home
          </a>
        </div>
      </div>
    ),
  },
])
