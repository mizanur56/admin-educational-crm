import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import { AccountPage } from '../pages/account'
import { ActivityHistoryPage } from '../pages/activity-history'
import { ApplicationsPage } from '../pages/applications'
import { AuditLogsPage } from '../pages/audit-logs'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '../pages/auth'
import { DashboardPage } from '../pages/dashboard'
import { DocumentsPage } from '../pages/documents'
import { EmployeesPage, EmployeeCreatePage, EmployeeProfilePage } from '../pages/employees'
import { FollowUpsPage } from '../pages/follow-ups'
import { LeadsPage } from '../pages/leads'
import { MasterDataPage, MasterDataItemsPage } from '../pages/master-data'
import { PaymentsPage } from '../pages/payments'
import { ProfilePage } from '../pages/profile'
import { ReportsPage } from '../pages/reports'
import { RolesPage } from '../pages/roles'
import { SettingsPage } from '../pages/settings'
import { StudentsPage } from '../pages/students'
import { UsersPage } from '../pages/users'
import PermissionRoute from './PermissionRoute'
import ProtectedRoute from './ProtectedRoute'

const routes = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/account', element: <AccountPage /> },

          {
            element: <PermissionRoute permission="lead:view" />,
            children: [{ path: '/leads', element: <LeadsPage /> }],
          },
          {
            element: <PermissionRoute permission="lead:convert" />,
            children: [
              { path: '/applications', element: <ApplicationsPage /> },
              { path: '/students', element: <StudentsPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="document:view" />,
            children: [{ path: '/documents', element: <DocumentsPage /> }],
          },
          {
            element: <PermissionRoute permission="payment:view" />,
            children: [{ path: '/payments', element: <PaymentsPage /> }],
          },
          {
            element: <PermissionRoute permission="follow_up:view" />,
            children: [{ path: '/follow-ups', element: <FollowUpsPage /> }],
          },
          {
            element: <PermissionRoute permission="activity:view" />,
            children: [{ path: '/activity-history', element: <ActivityHistoryPage /> }],
          },
          {
            element: <PermissionRoute permission="report:view" />,
            children: [{ path: '/reports', element: <ReportsPage /> }],
          },
          {
            element: <PermissionRoute permission="employee:create" />,
            children: [{ path: '/employees/new', element: <EmployeeCreatePage /> }],
          },
          {
            element: <PermissionRoute permission="employee:edit" />,
            children: [{ path: '/employees/:id/edit', element: <EmployeeCreatePage /> }],
          },
          {
            element: <PermissionRoute permission="employee:view" />,
            children: [
              { path: '/employees', element: <EmployeesPage /> },
              { path: '/employees/:id', element: <EmployeeProfilePage /> },
            ],
          },
          {
            element: <PermissionRoute permission="user:view" />,
            children: [{ path: '/users', element: <UsersPage /> }],
          },
          {
            element: <PermissionRoute permission="role:view" />,
            children: [{ path: '/roles', element: <RolesPage /> }],
          },
          {
            element: <PermissionRoute permission="audit:view" />,
            children: [{ path: '/audit-logs', element: <AuditLogsPage /> }],
          },
          {
            element: <PermissionRoute permission="master_data:view" />,
            children: [
              { path: '/master-data', element: <MasterDataPage /> },
              { path: '/master-data/:groupSlug', element: <MasterDataItemsPage /> },
              { path: '/master-data/:groupSlug/:categoryKey', element: <MasterDataItemsPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="settings:view" />,
            children: [{ path: '/settings', element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <ProtectedRoute guestOnly>
            <LoginPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <ProtectedRoute guestOnly>
            <ForgotPasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <ProtectedRoute guestOnly>
            <ResetPasswordPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
]

const router = createBrowserRouter(routes)

export { router }
export default router
