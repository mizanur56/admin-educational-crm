import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import Account from '../pages/Account'
import ActivityHistory from '../pages/ActivityHistory'
import AuditLogs from '../pages/AuditLogs'
import ComingSoon from '../pages/ComingSoon'
import Dashboard from '../pages/Dashboard'
import EmployeeCreate from '../pages/EmployeeCreate'
import EmployeeProfile from '../pages/EmployeeProfile'
import Employees from '../pages/Employees'
import ForgotPassword from '../pages/ForgotPassword'
import Login from '../pages/Login'
import MasterData from '../pages/MasterData'
import MasterDataItems from '../pages/MasterDataItems'
import Profile from '../pages/Profile'
import ResetPassword from '../pages/ResetPassword'
import Roles from '../pages/Roles'
import Users from '../pages/Users'
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
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: <Profile /> },
          { path: '/account', element: <Account /> },

          {
            element: <PermissionRoute permission="lead:view" />,
            children: [{ path: '/leads', element: <ComingSoon title="Leads" /> }],
          },
          {
            element: <PermissionRoute permission="lead:convert" />,
            children: [
              { path: '/applications', element: <ComingSoon title="Applications" /> },
              { path: '/students', element: <ComingSoon title="Students" /> },
            ],
          },
          {
            element: <PermissionRoute permission="document:view" />,
            children: [{ path: '/documents', element: <ComingSoon title="Documents" /> }],
          },
          {
            element: <PermissionRoute permission="payment:view" />,
            children: [{ path: '/payments', element: <ComingSoon title="Payments" /> }],
          },
          {
            element: <PermissionRoute permission="follow_up:view" />,
            children: [{ path: '/follow-ups', element: <ComingSoon title="Follow-ups" /> }],
          },
          {
            element: <PermissionRoute permission="activity:view" />,
            children: [{ path: '/activity-history', element: <ActivityHistory /> }],
          },
          {
            element: <PermissionRoute permission="report:view" />,
            children: [{ path: '/reports', element: <ComingSoon title="Reports" /> }],
          },
          {
            element: <PermissionRoute permission="employee:create" />,
            children: [{ path: '/employees/new', element: <EmployeeCreate /> }],
          },
          {
            element: <PermissionRoute permission="employee:edit" />,
            children: [{ path: '/employees/:id/edit', element: <EmployeeCreate /> }],
          },
          {
            element: <PermissionRoute permission="employee:view" />,
            children: [
              { path: '/employees', element: <Employees /> },
              { path: '/employees/:id', element: <EmployeeProfile /> },
            ],
          },
          {
            element: <PermissionRoute permission="user:view" />,
            children: [{ path: '/users', element: <Users /> }],
          },
          {
            element: <PermissionRoute permission="role:view" />,
            children: [{ path: '/roles', element: <Roles /> }],
          },
          {
            element: <PermissionRoute permission="audit:view" />,
            children: [{ path: '/audit-logs', element: <AuditLogs /> }],
          },
          {
            element: <PermissionRoute permission="master_data:view" />,
            children: [
              { path: '/master-data', element: <MasterData /> },
              { path: '/master-data/:groupSlug', element: <MasterDataItems /> },
              { path: '/master-data/:groupSlug/:categoryKey', element: <MasterDataItems /> },
            ],
          },
          {
            element: <PermissionRoute permission="settings:view" />,
            children: [{ path: '/settings', element: <ComingSoon title="Settings" /> }],
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
            <Login />
          </ProtectedRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <ProtectedRoute guestOnly>
            <ForgotPassword />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <ProtectedRoute guestOnly>
            <ResetPassword />
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
