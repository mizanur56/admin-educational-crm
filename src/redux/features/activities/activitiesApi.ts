import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/utils/query'
import type { ActivityFeedResponse } from '@/types'

export type ActivityFeedParams = {
  from?: string
  to?: string
  search?: string
  category?: string
  userId?: string
}

export type ActivityPayload = {
  type: string
  relatedName?: string
  durationMin?: number | null
  outcome?: string
  notes?: string
}

const activitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listActivityFeed: builder.query<ActivityFeedResponse, ActivityFeedParams | void>({
      query: (params) => `/activities${toQuery({ ...(params || {}) })}`,
      providesTags: ['Activities'],
    }),
    createActivity: builder.mutation<{ activity: unknown }, ActivityPayload>({
      query: (body) => ({
        url: '/activities',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Activities'],
    }),
    recordActivityExport: builder.mutation<{ ok: boolean }, { count: number }>({
      query: (body) => ({
        url: '/activities/export',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useListActivityFeedQuery,
  useLazyListActivityFeedQuery,
  useCreateActivityMutation,
  useRecordActivityExportMutation,
} = activitiesApi
