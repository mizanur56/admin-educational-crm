import { MASTER_DATA_NAV_GROUPS } from './masterData'

export type NavIconName =
  | 'grid'
  | 'users'
  | 'file'
  | 'graduate'
  | 'folder'
  | 'card'
  | 'bell'
  | 'chart'
  | 'id'
  | 'user'
  | 'shield'
  | 'database'
  | 'settings'
  | 'activity'

export type NavItem = {
  to: string
  label: string
  icon: NavIconName
  permission?: string
  children?: NavItem[]
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    items: [{ to: '/dashboard', label: 'Overview', icon: 'grid' }],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    items: [
      { to: '/leads', label: 'Leads', icon: 'users', permission: 'lead:view' },
      { to: '/applications', label: 'Applications', icon: 'file', permission: 'lead:convert' },
      { to: '/students', label: 'Students', icon: 'graduate', permission: 'lead:convert' },
      { to: '/documents', label: 'Documents', icon: 'folder', permission: 'document:view' },
      { to: '/payments', label: 'Payments', icon: 'card', permission: 'payment:view' },
      { to: '/follow-ups', label: 'Follow-ups', icon: 'bell', permission: 'follow_up:view' },
      { to: '/activity-history', label: 'Activity History', icon: 'activity', permission: 'activity:view' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { to: '/reports', label: 'Reports', icon: 'chart', permission: 'report:view' },
      { to: '/employees', label: 'Employees', icon: 'id', permission: 'employee:view' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { to: '/users', label: 'Users', icon: 'user', permission: 'user:view' },
      { to: '/roles', label: 'Roles', icon: 'shield', permission: 'role:view' },
      { to: '/audit-logs', label: 'Audit Log', icon: 'file', permission: 'audit:view' },
      {
        to: '/master-data',
        label: 'Master Data',
        icon: 'database',
        permission: 'master_data:view',
        children: MASTER_DATA_NAV_GROUPS.map((group) => ({
          to: `/master-data/${group.slug}`,
          label: group.name,
          icon: 'database' as const,
          permission: 'master_data:view',
        })),
      },
      { to: '/settings', label: 'Settings', icon: 'settings', permission: 'settings:view' },
    ],
  },
]

export const APP_NAV_ITEMS = APP_NAV_GROUPS.flatMap((group) => group.items)

export type SearchablePage = {
  to: string
  label: string
  group: string
  keywords: string[]
}

const PAGE_KEYWORDS: Record<string, string[]> = {
  '/dashboard': ['home', 'overview', 'summary'],
  '/leads': ['prospect', 'enquiry', 'inquiry'],
  '/applications': ['admission', 'apply'],
  '/students': ['learner', 'client'],
  '/documents': ['files', 'papers'],
  '/payments': ['invoice', 'fee', 'billing'],
  '/follow-ups': ['reminder', 'task'],
  '/activity-history': ['timeline', 'calls', 'meetings', 'log'],
  '/reports': ['analytics', 'stats'],
  '/employees': ['staff', 'hr', 'people', 'directory'],
  '/users': ['accounts', 'login', 'access'],
  '/roles': ['permissions', 'access'],
  '/audit-logs': ['logs', 'history', 'security'],
  '/master-data': ['catalog', 'dropdowns', 'settings'],
  '/settings': ['config', 'preferences'],
  '/profile': ['me', 'photo', 'account'],
  '/account': ['password', 'security'],
}

export function flattenSearchablePages(): SearchablePage[] {
  const pages: SearchablePage[] = [
    { to: '/profile', label: 'Profile', group: 'Account', keywords: PAGE_KEYWORDS['/profile'] },
    { to: '/account', label: 'Change password', group: 'Account', keywords: PAGE_KEYWORDS['/account'] },
  ]

  for (const group of APP_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children?.length) {
        pages.push({
          to: item.to,
          label: item.label,
          group: group.label,
          keywords: PAGE_KEYWORDS[item.to] ?? [],
        })
        for (const child of item.children) {
          pages.push({
            to: child.to,
            label: child.label,
            group: item.label,
            keywords: [item.label, group.label],
          })
        }
      } else {
        pages.push({
          to: item.to,
          label: item.label,
          group: group.label,
          keywords: PAGE_KEYWORDS[item.to] ?? [],
        })
      }
    }
  }

  return pages
}
