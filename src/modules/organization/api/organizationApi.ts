import { api } from "@/shared/lib";
import { DepartmentsDto } from "@/types/dto/organization/DepartmentsDto";
import { PositionsDto } from "@/types/dto/organization/PositionsDto";
import { env } from "@/env";

export const organizationApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDepartments: builder.query<DepartmentsDto[], void>({
            query: () => ({ url: env.API_DEPARTMENTS_PATH, method: "GET" }),
            providesTags: ["Organization"],
        }),
        getPositions: builder.query<PositionsDto[], string | void>({
            query: (departmentId) => ({
                url: env.API_POSITIONS_PATH,
                method: "GET",
                params: departmentId ? { departmentId } : undefined,
            }),
            providesTags: ["Organization"],
        }),
        addedDepartments: builder.mutation<{ id: string; name: string }, { name: string }>({
            query: (body) => ({ url: env.API_DEPARTMENTS_PATH, method: "POST", data: body }),
            invalidatesTags: ["Organization"],
        }),
        addedPositions: builder.mutation<
            { id: string; name: string; departmentId: string },
            { name: string; departmentId: string }
        >({
            query: (body) => ({ url: env.API_POSITIONS_PATH, method: "POST", data: body }),
            invalidatesTags: ["Organization"],
        }),
        deleteDepartment: builder.mutation<
            void,
            {
                id: string;
                options?: {
                    reassignToDepartmentId?: string;
                    positionIdForReassignedUsers?: string;
                    deleteAllUsers?: boolean;
                };
            }
        >({
            query: ({ id, options }) => ({
                url: `${env.API_DEPARTMENTS_PATH}/${id}`,
                method: "DELETE",
                data: options ?? {},
            }),
            invalidatesTags: ["Organization", "Admin"],
        }),
        deletePosition: builder.mutation<
            void,
            {
                id: string;
                options?: { reassignToPositionId?: string; deleteAllUsers?: boolean };
            }
        >({
            query: ({ id, options }) => ({
                url: `${env.API_POSITIONS_PATH}/${id}`,
                method: "DELETE",
                data: options ?? {},
            }),
            invalidatesTags: ["Organization", "Admin"],
        }),
    }),
});

export const {
    useGetDepartmentsQuery,
    useGetPositionsQuery,
    useAddedDepartmentsMutation,
    useAddedPositionsMutation,
    useDeleteDepartmentMutation,
    useDeletePositionMutation,
} = organizationApi;
