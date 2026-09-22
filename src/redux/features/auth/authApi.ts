import { baseApi } from '../../api/baseApi'
import type { AuthSession } from '@/types'

export type LoginBody = {
  identifier: string
  password: string
  rememberMe: boolean
}

export type ForgotPasswordBody = {
  identifier: string
}

export type ResetPasswordBody = {
  token: string
  password: string
}

export type ChangePasswordBody = {
  currentPassword: string
  newPassword: string
}

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AuthSession, void>({
      query: () => '/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<AuthSession, LoginBody>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<{ message?: string; devResetPath?: string }, ForgotPasswordBody>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message?: string }, ResetPasswordBody>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    changePassword: builder.mutation<{ message?: string }, ChangePasswordBody>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi
