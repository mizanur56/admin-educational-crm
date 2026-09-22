import { baseApi } from '../../api/baseApi'
import type { GlobalSearchHit } from '@/types'

const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<{ results: GlobalSearchHit[] }, string>({
      query: (q) => `/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`,
      providesTags: ['Search'],
    }),
  }),
})

export const { useGlobalSearchQuery, useLazyGlobalSearchQuery } = searchApi
