import type {
  AdminUser,
  ApiErrorBody,
  ApiResult,
  ActivityFeedResponse,
  AuditLog,
  AuthSession,
  Department,
  MasterDataGroup,
  MasterDataHistory,
  MasterDataImportResult,
  MasterDataItem,
  PermissionRecord,
  RoleRecord,
  ScopeMap,
  UserActivity,
  UserSession,
  UserStatus,
  EmployeeOptions,
  EmployeeRecord,
  GlobalSearchHit,
} from '../types'

const API_BASE = '/api'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function asErrorBody(payload: unknown): ApiErrorBody | null {
  if (payload && typeof payload === 'object') {
    return payload as ApiErrorBody
  }
  return null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, headers, ...rest } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...rest,
  })

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (response.ok) {
    return {
      ok: true,
      status: response.status,
      data: payload as T,
    }
  }

  return {
    ok: false,
    status: response.status,
    data: asErrorBody(payload),
  }
}

export function getHealth() {
  return apiRequest<{ ok?: boolean }>('/health')
}

export function getMe() {
  return apiRequest<AuthSession>('/me')
}

export function login(identifier: string, password: string, rememberMe: boolean) {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: { identifier, password, rememberMe },
  })
}

export function logout() {
  return apiRequest<null>('/auth/logout', { method: 'POST' })
}

export function requestPasswordReset(identifier: string) {
  return apiRequest<{ message?: string; devResetPath?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { identifier },
  })
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ message?: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message?: string }>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}

export type UserListParams = {
  search?: string
  roleId?: string
  departmentId?: string
  teamId?: string
  status?: string
}

export function listUsers(params: UserListParams = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString() ? `?${query}` : ''
  return apiRequest<{ users: AdminUser[] }>(`/users${suffix}`)
}

export function getUser(id: string) {
  return apiRequest<{ user: AdminUser }>(`/users/${id}`)
}

export type UserPayload = {
  fullName: string
  email: string
  mobile: string
  username: string
  password?: string
  roleId: string
  departmentId: string | null
  teamId: string | null
  status: UserStatus
}

function userPayloadForm(body: UserPayload, photo?: File | null) {
  const form = new FormData()
  form.set('fullName', body.fullName)
  form.set('email', body.email)
  form.set('mobile', body.mobile)
  form.set('username', body.username)
  form.set('roleId', body.roleId)
  form.set('status', body.status)
  form.set('departmentId', body.departmentId || '')
  form.set('teamId', body.teamId || '')
  if (body.password) {
    form.set('password', body.password)
  }
  if (photo) {
    form.set('photo', photo)
  }
  return form
}

export function createUser(body: UserPayload, photo?: File | null) {
  return apiRequest<{ user?: AdminUser; reset?: { devResetPath?: string } }>('/users', {
    method: 'POST',
    body: photo ? userPayloadForm(body, photo) : body,
  })
}

export function updateUser(id: string, body: UserPayload, photo?: File | null) {
  return apiRequest<{ user: AdminUser; reset?: { devResetPath?: string } }>(`/users/${id}`, {
    method: 'PATCH',
    body: photo ? userPayloadForm(body, photo) : body,
  })
}

export function updateUserStatus(id: string, status: UserStatus) {
  return apiRequest<{ user: AdminUser }>(`/users/${id}/status`, { method: 'POST', body: { status } })
}

export function listUserSessions(id: string) {
  return apiRequest<{ sessions: UserSession[] }>(`/users/${id}/sessions`)
}

export function revokeUserSession(userId: string, sessionId: string) {
  return apiRequest<null>(`/users/${userId}/sessions/${sessionId}/revoke`, { method: 'POST' })
}

export function forceLogoutUser(id: string) {
  return apiRequest<null>(`/users/${id}/force-logout`, { method: 'POST' })
}

export function adminPasswordReset(id: string) {
  return apiRequest<{ message?: string; devResetPath?: string }>(`/users/${id}/password-reset`, {
    method: 'POST',
  })
}

export function setUserOverrides(id: string, overrides: unknown) {
  return apiRequest<{ user: AdminUser }>(`/users/${id}/overrides`, { method: 'PUT', body: { overrides } })
}

export function setUserScopes(id: string, scopes: ScopeMap) {
  return apiRequest<{ user: AdminUser }>(`/users/${id}/scopes`, { method: 'PUT', body: { scopes } })
}

export function listUserActivity(id: string) {
  return apiRequest<{ activity: UserActivity[] }>(`/users/${id}/activity`)
}

export type RoleListParams = {
  search?: string
  status?: string
}

export type RolePayload = {
  name: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

export function listRoles(params: RoleListParams = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString() ? `?${query}` : ''
  return apiRequest<{ roles: RoleRecord[] }>(`/roles${suffix}`)
}

export function getRole(id: string) {
  return apiRequest<{ role: RoleRecord }>(`/roles/${id}`)
}

export function createRole(body: RolePayload) {
  return apiRequest<{ role: RoleRecord }>('/roles', { method: 'POST', body })
}

export function updateRole(id: string, body: RolePayload) {
  return apiRequest<{ role: RoleRecord }>(`/roles/${id}`, { method: 'PATCH', body })
}

export function updateRoleStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  return apiRequest<{ role: RoleRecord }>(`/roles/${id}/status`, { method: 'POST', body: { status } })
}

export function deleteRole(id: string) {
  return apiRequest<null>(`/roles/${id}`, { method: 'DELETE' })
}

export function setRolePermissions(id: string, permissionIds: string[]) {
  return apiRequest<{ role: RoleRecord }>(`/roles/${id}/permissions`, {
    method: 'PUT',
    body: { permissionIds },
  })
}

export function listPermissions(search = '') {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest<{ permissions: PermissionRecord[] }>(`/permissions${suffix}`)
}

export function listDepartments() {
  return apiRequest<{ departments: Department[] }>('/master-data/departments')
}

export function listAuditLogs(search = '') {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest<{ logs: AuditLog[] }>(`/audit-logs${suffix}`)
}

export type ActivityFeedParams = {
  from?: string
  to?: string
  search?: string
  category?: string
  userId?: string
}

export function globalSearch(query: string, signal?: AbortSignal) {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  return apiRequest<{ results: GlobalSearchHit[] }>(`/search${suffix}`, { signal })
}

export function listActivityFeed(params: ActivityFeedParams = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString() ? `?${query}` : ''
  return apiRequest<ActivityFeedResponse>(`/activities${suffix}`)
}

export type ActivityPayload = {
  type: string
  relatedName?: string
  durationMin?: number | null
  outcome?: string
  notes?: string
}

export function createActivity(body: ActivityPayload) {
  return apiRequest<{ activity: unknown }>('/activities', { method: 'POST', body })
}

export function recordActivityExport(count: number) {
  return apiRequest<{ ok: boolean }>('/activities/export', { method: 'POST', body: { count } })
}

export type MasterDataItemParams = {
  category: string
  search?: string
  status?: string
  parentId?: string
  createdFrom?: string
  createdTo?: string
  sortBy?: string
  sortDir?: string
}

export type MasterDataItemPayload = {
  categoryKey: string
  name: string
  code?: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
  sortOrder?: number
  parentId?: string | null
  behaviorKey?: string | null
  startDate?: string
  endDate?: string
}

export function listMasterDataCategories() {
  return apiRequest<{ groups: MasterDataGroup[] }>('/master-data/categories')
}

export function listMasterDataItems(params: MasterDataItemParams) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  return apiRequest<{ items: MasterDataItem[] }>(`/master-data/items?${query}`)
}

export function listMasterDataOptions(category: string, parentId?: string) {
  const query = new URLSearchParams({ category })
  if (parentId) {
    query.set('parentId', parentId)
  }
  return apiRequest<{ items: Array<{ id: string; name: string; code: string | null; status: string }> }>(
    `/master-data/options?${query}`,
  )
}

export function createMasterDataItem(body: MasterDataItemPayload) {
  return apiRequest<{ item: MasterDataItem }>('/master-data/items', { method: 'POST', body })
}

export function updateMasterDataItem(id: string, body: MasterDataItemPayload) {
  return apiRequest<{ item: MasterDataItem }>(`/master-data/items/${id}`, { method: 'PATCH', body })
}

export function deleteMasterDataItem(id: string, category: string) {
  return apiRequest<null>(`/master-data/items/${id}?category=${encodeURIComponent(category)}`, { method: 'DELETE' })
}

export function listMasterDataHistory(id: string, category: string) {
  return apiRequest<{ history: MasterDataHistory[] }>(
    `/master-data/items/${id}/history?category=${encodeURIComponent(category)}`,
  )
}

export async function exportMasterData(category: string, format: 'csv' | 'xlsx') {
  const response = await fetch(
    `${API_BASE}/master-data/items/export?category=${encodeURIComponent(category)}&format=${format}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorBody | null
    return { ok: false as const, status: response.status, data: payload }
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="([^"]+)"/)
  return { ok: true as const, status: response.status, data: { blob, fileName: match?.[1] || `master-data.${format}` } }
}

export async function importMasterData(category: string, file: File) {
  const body = new FormData()
  body.append('category', category)
  body.append('file', file)
  const response = await fetch(`${API_BASE}/master-data/items/import`, {
    method: 'POST',
    credentials: 'include',
    body,
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    return { ok: false as const, status: response.status, data: asErrorBody(payload) }
  }
  return { ok: true as const, status: response.status, data: payload as MasterDataImportResult }
}

export type EmployeeListParams = {
  search?: string
  departmentId?: string
  teamId?: string
  designationId?: string
  roleId?: string
  employmentTypeId?: string
  employmentStatusId?: string
  reportingManagerId?: string
  joiningFrom?: string
  joiningTo?: string
}

export type EmployeePayload = {
  fullName: string
  mobile: string
  officialEmail: string
  designationId: string
  departmentId: string
  teamId: string | null
  roleId: string | null
  employmentTypeId: string
  employmentStatusId: string
  reportingManagerId: string | null
  joiningDate: string
}

function withQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString() ? `?${query}` : ''
  return `${path}${suffix}`
}

export function listEmployees(params: EmployeeListParams = {}) {
  return apiRequest<{ employees: EmployeeRecord[] }>(withQuery('/employees', params))
}

export function listEmployeeOptions() {
  return apiRequest<EmployeeOptions>('/employees/options')
}

export function getEmployee(id: string) {
  return apiRequest<{ employee: EmployeeRecord }>(`/employees/${id}`)
}

export function createEmployee(body: FormData) {
  return apiRequest<{
    employee: EmployeeRecord
    reset?: { message?: string; devResetPath?: string }
  }>('/employees', {
    method: 'POST',
    body,
  })
}

export function updateEmployee(id: string, body: EmployeePayload | FormData) {
  return apiRequest<{
    employee: EmployeeRecord
    reset?: { message?: string; devResetPath?: string }
  }>(`/employees/${id}`, { method: 'PATCH', body })
}

export function uploadEmployeePhoto(id: string, file: File) {
  const body = new FormData()
  body.set('photo', file)
  return apiRequest<{ employee: EmployeeRecord }>(`/employees/${id}/photo`, {
    method: 'POST',
    body,
  })
}

export function uploadEmployeeDocument(id: string, field: string, file: File) {
  const body = new FormData()
  body.set(field, file)
  return apiRequest<{ employee: EmployeeRecord }>(`/employees/${id}/documents`, {
    method: 'POST',
    body,
  })
}

export function deleteEmployeeDocument(id: string, documentId: string) {
  return apiRequest<{ employee: EmployeeRecord }>(`/employees/${id}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export async function fetchEmployeeDocumentBlob(employeeId: string, documentId: string) {
  const response = await fetch(`${API_BASE}/employees/${employeeId}/documents/${documentId}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    return { ok: false as const, error: 'Unable to load the document.' }
  }
  const blob = await response.blob()
  return {
    ok: true as const,
    blob,
    mimeType: response.headers.get('content-type') || blob.type,
  }
}

export function updateEmployeeStatus(
  id: string,
  body: { employmentStatusId: string } | { status: 'ACTIVE' | 'INACTIVE' },
) {
  return apiRequest<{ employee: EmployeeRecord }>(`/employees/${id}/status`, {
    method: 'POST',
    body,
  })
}
