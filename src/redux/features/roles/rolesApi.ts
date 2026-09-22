import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/utils/query'
import type { PermissionRecord, RoleRecord } from '@/types'

export type RoleListParams = {
  search?: string
  status?: string
}

export type RolePayload = {
  name: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listRoles: builder.query<{ roles: RoleRecord[] }, RoleListParams | void>({
      query: (params) => `/roles${toQuery({ ...(params || {}) })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.roles.map(({ id }) => ({ type: 'Role' as const, id })),
              { type: 'Roles', id: 'LIST' },
            ]
          : [{ type: 'Roles', id: 'LIST' }],
    }),
    getRole: builder.query<{ role: RoleRecord }, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Role', id }],
    }),
    createRole: builder.mutation<{ role: RoleRecord }, RolePayload>({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: builder.mutation<{ role: RoleRecord }, { id: string; body: RolePayload }>({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Role', id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    updateRoleStatus: builder.mutation<
      { role: RoleRecord },
      { id: string; status: 'ACTIVE' | 'INACTIVE' }
    >({
      query: ({ id, status }) => ({
        url: `/roles/${id}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Role', id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    deleteRole: builder.mutation<null, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    setRolePermissions: builder.mutation<
      { role: RoleRecord },
      { id: string; permissionIds: string[] }
    >({
      query: ({ id, permissionIds }) => ({
        url: `/roles/${id}/permissions`,
        method: 'PUT',
        body: { permissionIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Role', id }],
    }),
    listPermissions: builder.query<{ permissions: PermissionRecord[] }, string | void>({
      query: (search = '') => `/permissions${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      providesTags: ['Permissions'],
    }),
  }),
})

export const {
  useListRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useUpdateRoleStatusMutation,
  useDeleteRoleMutation,
  useSetRolePermissionsMutation,
  useListPermissionsQuery,
} = rolesApi
