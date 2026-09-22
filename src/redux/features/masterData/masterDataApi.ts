import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/utils/query'
import type {
  Department,
  MasterDataGroup,
  MasterDataHistory,
  MasterDataImportResult,
  MasterDataItem,
} from '@/types'

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

const masterDataApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMasterDataCategories: builder.query<{ groups: MasterDataGroup[] }, void>({
      query: () => '/master-data/categories',
      providesTags: ['MasterDataCategories'],
    }),
    listMasterDataItems: builder.query<{ items: MasterDataItem[] }, MasterDataItemParams>({
      query: (params) => `/master-data/items${toQuery(params)}`,
      providesTags: (_r, _e, params) => [{ type: 'MasterDataItems', id: params.category }],
    }),
    listMasterDataOptions: builder.query<
      { items: Array<{ id: string; name: string; code: string | null; status: string }> },
      { category: string; parentId?: string }
    >({
      query: ({ category, parentId }) =>
        `/master-data/options${toQuery({ category, parentId })}`,
    }),
    createMasterDataItem: builder.mutation<{ item: MasterDataItem }, MasterDataItemPayload>({
      query: (body) => ({
        url: '/master-data/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'MasterDataItems', id: body.categoryKey },
        'MasterDataCategories',
      ],
    }),
    updateMasterDataItem: builder.mutation<
      { item: MasterDataItem },
      { id: string; body: MasterDataItemPayload }
    >({
      query: ({ id, body }) => ({
        url: `/master-data/items/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { body }) => [
        { type: 'MasterDataItems', id: body.categoryKey },
        'MasterDataCategories',
      ],
    }),
    deleteMasterDataItem: builder.mutation<null, { id: string; category: string }>({
      query: ({ id, category }) => ({
        url: `/master-data/items/${id}?category=${encodeURIComponent(category)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { category }) => [
        { type: 'MasterDataItems', id: category },
        'MasterDataCategories',
      ],
    }),
    listMasterDataHistory: builder.query<
      { history: MasterDataHistory[] },
      { id: string; category: string }
    >({
      query: ({ id, category }) =>
        `/master-data/items/${id}/history?category=${encodeURIComponent(category)}`,
      providesTags: (_r, _e, { id }) => [{ type: 'MasterDataHistory', id }],
    }),
    listDepartments: builder.query<{ departments: Department[] }, void>({
      query: () => '/master-data/departments',
      providesTags: ['Departments'],
    }),
    importMasterData: builder.mutation<
      MasterDataImportResult,
      { category: string; file: File }
    >({
      query: ({ category, file }) => {
        const body = new FormData()
        body.append('category', category)
        body.append('file', file)
        return {
          url: '/master-data/items/import',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (_r, _e, { category }) => [
        { type: 'MasterDataItems', id: category },
        'MasterDataCategories',
      ],
    }),
  }),
})

export const {
  useListMasterDataCategoriesQuery,
  useListMasterDataItemsQuery,
  useListMasterDataOptionsQuery,
  useCreateMasterDataItemMutation,
  useUpdateMasterDataItemMutation,
  useDeleteMasterDataItemMutation,
  useListMasterDataHistoryQuery,
  useListDepartmentsQuery,
  useImportMasterDataMutation,
} = masterDataApi
