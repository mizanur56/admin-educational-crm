import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { toast } from 'react-toastify'
import { config } from '@/config'
import { clearSession } from '../features/auth/authSlice'

function getToastMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const body = data as Record<string, unknown>
  if (typeof body.error === 'string' && body.error.trim()) return body.error
  if (typeof body.message === 'string' && body.message.trim()) return body.message
  return fallback
}

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url
}

const isGuestAuthEndpoint = (url: string) =>
  /\/auth\/(login|forgot-password|reset-password)(\?|\/|$)/i.test(url) || url === '/me'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: config.api,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json')
    return headers
  },
})

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  const requestUrl = getRequestUrl(args)
  const status = result.error?.status

  if (status === 401 && !isGuestAuthEndpoint(requestUrl)) {
    toast.error(getToastMessage(result.error?.data, 'Session expired. Please sign in again.'))
    api.dispatch(clearSession())
    try {
      const path = window.location.pathname
      if (!path.includes('/login') && !path.includes('/forgot-password') && !path.includes('/reset-password')) {
        window.location.assign('/login')
      }
    } catch {
      window.location.assign('/login')
    }
  }

  if (status === 403) {
    toast.error(getToastMessage(result.error?.data, 'You do not have permission for this action.'))
  }

  if (status === 404 && !isGuestAuthEndpoint(requestUrl)) {
    toast.error(getToastMessage(result.error?.data, 'Not found.'))
  }

  if (status === 409) {
    toast.error(getToastMessage(result.error?.data, 'Conflict with an existing resource.'))
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Auth',
    'Users',
    'User',
    'Roles',
    'Role',
    'Permissions',
    'Employees',
    'Employee',
    'EmployeeOptions',
    'MasterDataCategories',
    'MasterDataItems',
    'MasterDataHistory',
    'Departments',
    'Activities',
    'AuditLogs',
    'Search',
  ],
  endpoints: () => ({}),
})
