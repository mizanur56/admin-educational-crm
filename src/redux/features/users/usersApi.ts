import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/utils/query'
import type {
  AdminUser,
  ScopeMap,
  UserActivity,
  UserSession,
  UserStatus,
} from '@/types'

export type UserListParams = {
  search?: string
  roleId?: string
  departmentId?: string
  teamId?: string
  status?: string
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

const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<{ users: AdminUser[] }, UserListParams | void>({
      query: (params) => `/users${toQuery({ ...(params || {}) })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query<{ user: AdminUser }, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<
      { user?: AdminUser; reset?: { devResetPath?: string } },
      { body: UserPayload | FormData }
    >({
      query: ({ body }) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation<
      { user: AdminUser; reset?: { devResetPath?: string } },
      { id: string; body: UserPayload | FormData }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'User', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    updateUserStatus: builder.mutation<{ user: AdminUser }, { id: string; status: UserStatus }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'User', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    listUserSessions: builder.query<{ sessions: UserSession[] }, string>({
      query: (id) => `/users/${id}/sessions`,
      providesTags: (_r, _e, id) => [{ type: 'User', id: `${id}-sessions` }],
    }),
    revokeUserSession: builder.mutation<null, { userId: string; sessionId: string }>({
      query: ({ userId, sessionId }) => ({
        url: `/users/${userId}/sessions/${sessionId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'User', id: `${userId}-sessions` }],
    }),
    forceLogoutUser: builder.mutation<null, string>({
      query: (id) => ({
        url: `/users/${id}/force-logout`,
        method: 'POST',
      }),
    }),
    adminPasswordReset: builder.mutation<{ message?: string; devResetPath?: string }, string>({
      query: (id) => ({
        url: `/users/${id}/password-reset`,
        method: 'POST',
      }),
    }),
    setUserOverrides: builder.mutation<{ user: AdminUser }, { id: string; overrides: unknown }>({
      query: ({ id, overrides }) => ({
        url: `/users/${id}/overrides`,
        method: 'PUT',
        body: { overrides },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }],
    }),
    setUserScopes: builder.mutation<{ user: AdminUser }, { id: string; scopes: ScopeMap }>({
      query: ({ id, scopes }) => ({
        url: `/users/${id}/scopes`,
        method: 'PUT',
        body: { scopes },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }],
    }),
    listUserActivity: builder.query<{ activity: UserActivity[] }, string>({
      query: (id) => `/users/${id}/activity`,
    }),
  }),
})

export const {
  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useListUserSessionsQuery,
  useRevokeUserSessionMutation,
  useForceLogoutUserMutation,
  useAdminPasswordResetMutation,
  useSetUserOverridesMutation,
  useSetUserScopesMutation,
  useListUserActivityQuery,
} = usersApi
