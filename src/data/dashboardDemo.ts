export type DashIconName =
  | 'users'
  | 'calendar'
  | 'graduate'
  | 'revenue'
  | 'phone'
  | 'mail'
  | 'clock'
  | 'plus'
  | 'file'
  | 'card'
  | 'bell'
  | 'quote'

export type DashTone = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'primary'

export const dashboardStats: Array<{
  key: string
  label: string
  value: string
  change: number
  tone: Exclude<DashTone, 'primary'>
  icon: DashIconName
}> = [
  {
    key: 'leads',
    label: 'Total Leads',
    value: '248',
    change: 12,
    tone: 'blue',
    icon: 'users',
  },
  {
    key: 'applications',
    label: 'Active Applications',
    value: '96',
    change: 8,
    tone: 'green',
    icon: 'calendar',
  },
  {
    key: 'students',
    label: 'Converted Students',
    value: '32',
    change: 19,
    tone: 'purple',
    icon: 'graduate',
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    value: '৳ 4,85,000',
    change: 15,
    tone: 'orange',
    icon: 'revenue',
  },
  {
    key: 'followups',
    label: 'Pending Follow-ups',
    value: '18',
    change: -22,
    tone: 'rose',
    icon: 'phone',
  },
]

export const leadSources = [
  { label: 'Facebook Ads', value: 79, percent: 32, color: '#38bdf8' },
  { label: 'Website', value: 60, percent: 24, color: '#34d399' },
  { label: 'WhatsApp', value: 45, percent: 18, color: '#818cf8' },
  { label: 'Referral', value: 30, percent: 12, color: '#fb7185' },
  { label: 'Email', value: 20, percent: 8, color: '#f43f5e' },
  { label: 'Others', value: 14, percent: 6, color: '#fbbf24' },
]

export const leadTrend = [
  { label: 'Sep 3', value: 22 },
  { label: 'Sep 4', value: 26 },
  { label: 'Sep 5', value: 38 },
  { label: 'Sep 6', value: 41 },
  { label: 'Sep 7', value: 28 },
  { label: 'Sep 8', value: 46 },
  { label: 'Sep 9', value: 62 },
]

export const recentLeads = [
  {
    name: 'Ariful Islam',
    email: 'ariful@gmail.com',
    country: 'Canada',
    flag: '🇨🇦',
    source: 'Facebook Ads',
    status: 'New',
    created: '2h ago',
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat@gmail.com',
    country: 'UK',
    flag: '🇬🇧',
    source: 'Website',
    status: 'Contacted',
    created: '4h ago',
  },
  {
    name: 'Rafiq Ahmed',
    email: 'rafiq@gmail.com',
    country: 'Australia',
    flag: '🇦🇺',
    source: 'WhatsApp',
    status: 'Qualified',
    created: '6h ago',
  },
  {
    name: 'Sadia Akter',
    email: 'sadia@gmail.com',
    country: 'USA',
    flag: '🇺🇸',
    source: 'Referral',
    status: 'Counselling',
    created: '8h ago',
  },
  {
    name: 'Tanvir Hasan',
    email: 'tanvir@gmail.com',
    country: 'Malaysia',
    flag: '🇲🇾',
    source: 'Email',
    status: 'Follow Up',
    created: '10h ago',
  },
]

export const upcomingFollowUps: Array<{
  title: string
  detail: string
  tone: Exclude<DashTone, 'primary'>
  icon: DashIconName
}> = [
  {
    title: 'Call with Rafiq Ahmed',
    detail: 'Today, 10:00 AM  •  +880 1712 345678',
    tone: 'rose',
    icon: 'phone',
  },
  {
    title: 'Email to Nusrat Jahan',
    detail: 'Today, 02:00 PM  •  nusrat@gmail.com',
    tone: 'blue',
    icon: 'mail',
  },
  {
    title: 'Counselling Session - Sadia Akter',
    detail: 'Today, 04:00 PM  •  Office',
    tone: 'purple',
    icon: 'users',
  },
  {
    title: 'Follow up - Tanvir Hasan',
    detail: 'Tomorrow, 11:00 AM  •  +880 1812 345678',
    tone: 'orange',
    icon: 'clock',
  },
  {
    title: 'Call with Ariful Islam',
    detail: 'Tomorrow, 03:00 PM  •  +880 1712 345678',
    tone: 'green',
    icon: 'phone',
  },
]

export const calendarEvents: Record<number, string[]> = {
  2: ['followup'],
  5: ['meeting'],
  9: ['today', 'application'],
  12: ['payment'],
  15: ['followup'],
  18: ['meeting'],
  19: ['application'],
  23: ['followup'],
  26: ['payment', 'meeting'],
  27: ['application'],
}

export const quickActions: Array<{
  label: string
  hint: string
  tone: DashTone
  icon: DashIconName
}> = [
  { label: 'Create New Lead', hint: '', tone: 'primary', icon: 'plus' },
  { label: 'Add Application', hint: 'Create a new application', tone: 'blue', icon: 'file' },
  { label: 'Add Student', hint: 'Register a new student', tone: 'green', icon: 'graduate' },
  { label: 'Add Payment', hint: 'Record a payment', tone: 'orange', icon: 'card' },
  { label: 'Schedule Follow-up', hint: 'Set a follow-up reminder', tone: 'purple', icon: 'bell' },
]
