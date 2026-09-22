import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/utils/query'
import type { EmployeeOptions, EmployeeRecord } from '@/types'

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

const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEmployees: builder.query<{ employees: EmployeeRecord[] }, EmployeeListParams | void>({
      query: (params) => `/employees${toQuery({ ...(params || {}) })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.employees.map(({ id }) => ({ type: 'Employee' as const, id })),
              { type: 'Employees', id: 'LIST' },
            ]
          : [{ type: 'Employees', id: 'LIST' }],
    }),
    listEmployeeOptions: builder.query<EmployeeOptions, void>({
      query: () => '/employees/options',
      providesTags: ['EmployeeOptions'],
    }),
    getEmployee: builder.query<{ employee: EmployeeRecord }, string>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: builder.mutation<
      { employee: EmployeeRecord; reset?: { message?: string; devResetPath?: string } },
      FormData
    >({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Employees', id: 'LIST' },
        'EmployeeOptions',
      ],
    }),
    updateEmployee: builder.mutation<
      { employee: EmployeeRecord; reset?: { message?: string; devResetPath?: string } },
      { id: string; body: EmployeePayload | FormData }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Employee', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
    uploadEmployeePhoto: builder.mutation<{ employee: EmployeeRecord }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData()
        body.set('photo', file)
        return {
          url: `/employees/${id}/photo`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee', id }],
    }),
    uploadEmployeeDocument: builder.mutation<
      { employee: EmployeeRecord },
      { id: string; field: string; file: File }
    >({
      query: ({ id, field, file }) => {
        const body = new FormData()
        body.set(field, file)
        return {
          url: `/employees/${id}/documents`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee', id }],
    }),
    deleteEmployeeDocument: builder.mutation<
      { employee: EmployeeRecord },
      { id: string; documentId: string }
    >({
      query: ({ id, documentId }) => ({
        url: `/employees/${id}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee', id }],
    }),
    updateEmployeeStatus: builder.mutation<
      { employee: EmployeeRecord },
      { id: string; body: { employmentStatusId: string } | { status: 'ACTIVE' | 'INACTIVE' } }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/status`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Employee', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListEmployeesQuery,
  useListEmployeeOptionsQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useUploadEmployeePhotoMutation,
  useUploadEmployeeDocumentMutation,
  useDeleteEmployeeDocumentMutation,
  useUpdateEmployeeStatusMutation,
} = employeesApi
