import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import Account from './pages/Account'
import Profile from './pages/Profile'
import AuditLogs from './pages/AuditLogs'
import ActivityHistory from './pages/ActivityHistory'
import ComingSoon from './pages/ComingSoon'
import LeadCreate from './pages/LeadCreate'
import Leads from './pages/Leads'
import Dashboard from './pages/Dashboard'
import EmployeeCreate from './pages/EmployeeCreate'
import EmployeeProfile from './pages/EmployeeProfile'
import Employees from './pages/Employees'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import MasterData from './pages/MasterData'
import MasterDataItems from './pages/MasterDataItems'
import ResetPassword from './pages/ResetPassword'
import Roles from './pages/Roles'
import Users from './pages/Users'
import PermissionRoute from './routes/PermissionRoute'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Account />} />
          <Route element={<PermissionRoute permission="lead:create" />}>
            <Route path="/leads/new" element={<LeadCreate />} />
          </Route>
          <Route element={<PermissionRoute permission="lead:view" />}>
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadCreate />} />
          </Route>
          <Route element={<PermissionRoute permission="lead:convert" />}>
            <Route path="/applications" element={<ComingSoon title="Applications" />} />
            <Route path="/students" element={<ComingSoon title="Students" />} />
          </Route>
          <Route element={<PermissionRoute permission="document:view" />}>
            <Route path="/documents" element={<ComingSoon title="Documents" />} />
          </Route>
          <Route element={<PermissionRoute permission="payment:view" />}>
            <Route path="/payments" element={<ComingSoon title="Payments" />} />
          </Route>
          <Route element={<PermissionRoute permission="follow_up:view" />}>
            <Route path="/follow-ups" element={<ComingSoon title="Follow-ups" />} />
          </Route>
          <Route element={<PermissionRoute permission="activity:view" />}>
            <Route path="/activity-history" element={<ActivityHistory />} />
          </Route>
          <Route element={<PermissionRoute permission="report:view" />}>
            <Route path="/reports" element={<ComingSoon title="Reports" />} />
          </Route>
          <Route element={<PermissionRoute permission="employee:create" />}>
            <Route path="/employees/new" element={<EmployeeCreate />} />
          </Route>
          <Route element={<PermissionRoute permission="employee:edit" />}>
            <Route path="/employees/:id/edit" element={<EmployeeCreate />} />
          </Route>
          <Route element={<PermissionRoute permission="employee:view" />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
          </Route>
          <Route element={<PermissionRoute permission="user:view" />}>
            <Route path="/users" element={<Users />} />
          </Route>
          <Route element={<PermissionRoute permission="role:view" />}>
            <Route path="/roles" element={<Roles />} />
          </Route>
          <Route element={<PermissionRoute permission="audit:view" />}>
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
          <Route element={<PermissionRoute permission="master_data:view" />}>
            <Route path="/master-data" element={<MasterData />} />
            <Route path="/master-data/:groupSlug" element={<MasterDataItems />} />
            <Route path="/master-data/:groupSlug/:categoryKey" element={<MasterDataItems />} />
          </Route>
          <Route element={<PermissionRoute permission="settings:view" />}>
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
