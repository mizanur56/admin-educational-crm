import { baseApi } from '../../api/baseApi'
import type { AuditLog } from '@/types'

const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAuditLogs: builder.query<{ logs: AuditLog[] }, string | void>({
      query: (search = '') => `/audit-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      providesTags: ['AuditLogs'],
    }),
  }),
})

export const { useListAuditLogsQuery, useLazyListAuditLogsQuery } = auditLogsApi
