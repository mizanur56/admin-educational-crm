import { Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function AuthLayout() {
  return (
    <div className="auth-page">
      <ThemeToggle className="icon-btn auth-theme-toggle" />
      <Outlet />
    </div>
  )
}
