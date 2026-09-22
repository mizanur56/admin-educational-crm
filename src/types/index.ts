export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type RecordStatus = 'ACTIVE' | 'INACTIVE'
export type DataScopeLevel = 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL'
export type ScopeMap = Record<string, DataScopeLevel>

export type AuthUser = {
  id: string
  fullName: string
  email: string
  username: string
  mobile: string
  photoUrl?: string | null
  status: UserStatus
  departmentId: string | null
  teamId: string | null
  primaryRoleId: string
}

export type AuthRole = {
  id: string
  key: string
  name: string
}

export type AuthSession = {
  user: AuthUser
  role: AuthRole
  roles: string[]
  permissions: string[]
  dataScopes: ScopeMap
  dataScope: ScopeMap
}

export type NamedRef = {
  id: string
  name: string
}

export type RoleRef = NamedRef & {
  key?: string
  status?: RecordStatus
}

export type AdminUser = {
  id: string
  fullName: string
  email: string
  username: string
  mobile: string
  photoUrl?: string | null
  status: UserStatus
  role: RoleRef | null
  department: NamedRef | null
  team: NamedRef | null
  lastLoginAt?: string | Date | null
  createdAt?: string | Date
  updatedAt?: string | Date
  acceptsLeadAssignment?: boolean
  inactiveOwnerLeadCount?: number
  dataScopes?: ScopeMap
}

export type UserSession = {
  id: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string | Date
  lastActiveAt?: string | Date | null
  expiresAt?: string | Date
  revokedAt?: string | Date | null
  current?: boolean
  active: boolean
}

export type UserActivity = {
  id: string
  action: string
  createdAt: string | Date
}

export type Department = NamedRef & {
  key?: string
  teams: Array<NamedRef & { key?: string }>
}

export type RoleRecord = {
  id: string
  key: string
  name: string
  description: string | null
  status: RecordStatus
  isSystem: boolean
  assignedUserCount: number
  permissions: string[]
  permissionIds: string[]
}

export type PermissionRecord = {
  id: string
  key: string
  module: string
  resource: string
  action: string
  description: string | null
}

export type AuditLog = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string | Date
  user: { id: string; fullName: string; email: string } | null
}

export type ActivityFeedCategory =
  | 'call'
  | 'message'
  | 'meeting'
  | 'email'
  | 'document'
  | 'status'
  | 'assignment'
  | 'payment'
  | 'file'
  | 'system'

export type ActivityFeedUser = {
  id: string
  fullName: string
  email: string
  roleName: string | null
  photoUrl?: string | null
}

export type ActivityFeedItem = {
  id: string
  source: 'activity' | 'audit'
  category: ActivityFeedCategory
  action: string
  actionKey: string
  module: string
  details: string
  relatedName: string | null
  relatedType: string | null
  relatedId: string | null
  outcome: string | null
  durationMin: number | null
  status: string
  ipAddress: string | null
  userAgent: string | null
  occurredAt: string | Date
  user: ActivityFeedUser | null
  metadata: Record<string, unknown> | null
}

export type ActivitySummaryStat = {
  value: number
  change: number
  series: number[]
}

export type ActivityFeedResponse = {
  from: string
  to: string
  items: ActivityFeedItem[]
  counts: Record<'all' | ActivityFeedCategory, number>
  summary: Record<'call' | 'message' | 'meeting' | 'email' | 'document', ActivitySummaryStat>
}

export type MasterDataCategory = {
  key: string
  name: string
  recordCount: number
  parentCategoryKey?: string
  extraFields?: 'none' | 'intake' | 'leadStatus'
  codePolicy?: 'optional' | 'recommended' | 'required'
}

export type MasterDataGroup = {
  group: string
  categories: MasterDataCategory[]
}

export type MasterDataItem = {
  id: string
  categoryKey: string
  name: string
  code: string | null
  description: string | null
  parentId: string | null
  parentName: string | null
  status: RecordStatus
  sortOrder: number
  isSystem: boolean
  behaviorKey: string | null
  extras: Record<string, unknown> | null
  usageCount: number
  createdAt: string | Date
  updatedAt: string | Date
  createdBy: { id: string; fullName: string } | null
  updatedBy: { id: string; fullName: string } | null
}

export type MasterDataHistory = {
  id: string
  action: string
  metadata: unknown
  createdAt: string | Date
  user: { id: string; fullName: string; email: string; role: string | null } | null
}

export type MasterDataImportResult = {
  total: number
  successful: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

export type EmployeeCrmAccess = 'ENABLED' | 'DISABLED' | 'NONE'

export type EmployeeRef = {
  id: string
  fullName: string
  employeeCode: string
}

export type EmployeeStatusRef = NamedRef & {
  code: string | null
}

export type EmployeeRecord = {
  id: string
  employeeCode: string
  fullName: string
  mobile: string
  officialEmail: string
  photoUrl: string | null
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  dateOfBirth?: string | null
  nationality?: string | null
  identityNumber?: string | null
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'OTHER' | null
  personalEmail?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  emergencyName?: string | null
  emergencyRelationship?: string | null
  emergencyMobile?: string | null
  emergencyAddress?: string | null
  documents?: Array<{ id: string; type: string; fileName: string; mimeType: string; fileSize: number }>
  designation: NamedRef | null
  department: NamedRef | null
  team: NamedRef | null
  role: RoleRef | null
  employmentType: NamedRef | null
  employmentStatus: EmployeeStatusRef | null
  reportingManager: EmployeeRef | null
  joiningDate: string
  crmAccess: EmployeeCrmAccess
  user: { id: string; status: UserStatus; username?: string } | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type EmployeeOption = NamedRef & {
  code?: string | null
}

export type EmployeeRoleOption = {
  id: string
  key: string
  name: string
}

export type EmployeeOptions = {
  departments: Department[]
  designations: EmployeeOption[]
  employmentTypes: EmployeeOption[]
  employmentStatuses: EmployeeOption[]
  roles: EmployeeRoleOption[]
  managers: EmployeeRef[]
  nextEmployeeCode?: string
}

export type ApiErrorBody = {
  error?: string
  message?: string
  code?: string
  devResetPath?: string
  fields?: Record<string, string>
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: ApiErrorBody | null }

export type GlobalSearchHit = {
  id: string
  type: 'page' | 'user' | 'employee' | 'role' | 'master-data' | 'activity' | 'audit'
  title: string
  subtitle?: string
  href: string
  group: string
}
