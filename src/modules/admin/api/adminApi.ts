import { api } from '@/shared/lib'
import { UserRole } from '@/types/dto/enums/UserRole'

export interface RegistrationApplicationAdminDto {
    id: string
    userId: string
    fullName: string
    email: string
    requestedRole: UserRole
    status: 'Pending' | 'Approved' | 'Rejected'
    createdAt: string
}

export interface AdminUserListItemDto {
    id: string
    fullName: string
    email: string
    role: UserRole
    isApproved: boolean
    departmentId: string
    positionId: string
    departmentName: string
    positionName: string
}

export interface OrgMemberDto {
    id: string
    fullName: string
    email: string
}

export interface UpdateAdminUserRequest {
    fullName?: string | null
    email?: string | null
    isApproved?: boolean | null
    role?: UserRole | null
    departmentId?: string | null
    positionId?: string | null
    newPassword?: string | null
}

const base = '/admin'

export const adminApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getPendingRegistrations: builder.query<RegistrationApplicationAdminDto[], void>({
            query: () => ({ url: `${base}/registrations`, method: 'GET' }),
            providesTags: ['Admin'],
        }),
        getAdminUsers: builder.query<AdminUserListItemDto[], void>({
            query: () => ({ url: `${base}/users`, method: 'GET' }),
            providesTags: ['Admin'],
        }),
        approveRegistration: builder.mutation<void, string>({
            query: (id) => ({ url: `${base}/registrations/${id}/approve`, method: 'POST' }),
            invalidatesTags: ['Admin'],
        }),
        rejectRegistration: builder.mutation<void, string>({
            query: (id) => ({ url: `${base}/registrations/${id}/reject`, method: 'POST' }),
            invalidatesTags: ['Admin'],
        }),
        updateUserRole: builder.mutation<void, { userId: string; role: UserRole }>({
            query: ({ userId, role }) => ({
                url: `${base}/users/${userId}/role`,
                method: 'PATCH',
                data: { role },
            }),
            invalidatesTags: ['Admin'],
        }),
        updateAdminUser: builder.mutation<void, { userId: string; data: UpdateAdminUserRequest }>({
            query: ({ userId, data }) => ({
                url: `${base}/users/${userId}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: ['Admin'],
        }),
        deleteAdminUser: builder.mutation<void, { userId: string; }>({
            query: ({ userId }) => ({
                url: `${base}/users/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Admin'],
        }),
        getDepartmentUsers: builder.query<OrgMemberDto[], string>({
            query: (departmentId) => ({
                url: `${base}/departments/${departmentId}/users`,
                method: 'GET',
            }),
        }),
        getPositionUsers: builder.query<OrgMemberDto[], string>({
            query: (positionId) => ({
                url: `${base}/positions/${positionId}/users`,
                method: 'GET',
            }),
        }),
    }),
})

export const {
    useGetPendingRegistrationsQuery,
    useGetAdminUsersQuery,
    useApproveRegistrationMutation,
    useRejectRegistrationMutation,
    useUpdateUserRoleMutation,
    useUpdateAdminUserMutation,
    useDeleteAdminUserMutation,
    useLazyGetDepartmentUsersQuery,
    useLazyGetPositionUsersQuery,
} = adminApi

