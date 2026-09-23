import { Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const ICON_BTN =
  'absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-icon hover:bg-hover-bg'

export default function AuthLayout() {
  return (
    <div className="relative grid min-h-dvh place-items-center p-6">
      <ThemeToggle className={ICON_BTN} />
      <Outlet />
    </div>
  )
}
