import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  Analytics01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Database01Icon,
  File01Icon,
  Folder01Icon,
  GraduationCapIcon,
  IdCardIcon,
  Notification03Icon,
  Settings01Icon,
  Shield01Icon,
  UserIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { NavIconName } from '../config/navigation'

const ICONS: Record<NavIconName, typeof DashboardSquare01Icon> = {
  grid: DashboardSquare01Icon,
  users: UserMultiple02Icon,
  file: File01Icon,
  graduate: GraduationCapIcon,
  folder: Folder01Icon,
  card: CreditCardIcon,
  bell: Notification03Icon,
  chart: Analytics01Icon,
  id: IdCardIcon,
  user: UserIcon,
  shield: Shield01Icon,
  database: Database01Icon,
  settings: Settings01Icon,
  activity: Activity01Icon,
}

type NavIconProps = {
  name: NavIconName
  size?: number
}

export default function NavIcon({ name, size = 18 }: NavIconProps) {
  const icon = ICONS[name]
  if (!icon) return null

  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={1.5}
    />
  )
}
