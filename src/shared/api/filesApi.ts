import { api } from "@/shared/lib/api/api";

export const filesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        deleteStoredFile: builder.mutation<void, string>({
            query: (fileId) => ({
                url: `/files/${encodeURIComponent(fileId)}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Task", "Knowledge", "Project", "ProjectComment"],
        }),
    }),
    overrideExisting: false,
});

export const { useDeleteStoredFileMutation } = filesApi;
