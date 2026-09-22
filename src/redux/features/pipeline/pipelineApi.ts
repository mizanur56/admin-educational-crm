import { baseApi } from '../../api/baseApi'

export type PipelineListResponse = {
  items: Array<Record<string, string>>
  total: number
}

export type PipelineResource =
  | 'leads'
  | 'applications'
  | 'students'
  | 'documents'
  | 'payments'
  | 'follow-ups'
  | 'reports'

const pipelineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPipeline: builder.query<PipelineListResponse, { resource: PipelineResource; search?: string }>({
      query: ({ resource, search }) => {
        const params = new URLSearchParams()
        if (search?.trim()) params.set('search', search.trim())
        const qs = params.toString()
        return `/pipeline/${resource}${qs ? `?${qs}` : ''}`
      },
      providesTags: (_r, _e, arg) => [{ type: 'Pipeline', id: arg.resource }],
    }),
  }),
})

export const { useListPipelineQuery } = pipelineApi
