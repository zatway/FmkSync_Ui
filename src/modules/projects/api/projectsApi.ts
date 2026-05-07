import { api } from "@/shared/lib";
import { env } from "@/env";

import { ProjectBriefDto } from "@/types/dto/projects/ProjectBriefDto";
import { ProjectDetailedDto } from "@/types/dto/projects/ProjectDetailedDto";
import { CreateProjectRequest } from "@/types/dto/projects/CreateProjectRequest";
import { UpdateProjectRequest } from "@/types/dto/projects/UpdateProjectRequest";
import { ProjectHistoryEntryDto } from "@/types/dto/projects/ProjectHistoryEntryDto";
import { ProjectCommentDto } from "@/types/dto/projectComments/ProjectCommentDto";
import { CreateProjectCommentRequest } from "@/types/dto/projectComments/CreateProjectCommentRequest";
import { UpdateProjectCommentRequest } from "@/types/dto/projectComments/UpdateProjectCommentRequest";
import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";

const getUrl = (endUrl: string) => `${env.API_PROJECTS_PATH}${endUrl}`;

export const projectsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProjects: builder.query<ProjectBriefDto[], { includeArchived?: boolean } | void>({
            query: (arg) => ({
                url: getUrl(arg?.includeArchived ? "?includeArchived=true" : ""),
                method: "GET",
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Project" as const, id })),
                          { type: "Project" as const, id: "LIST" },
                      ]
                    : [{ type: "Project" as const, id: "LIST" }],
        }),

        getProjectById: builder.query<ProjectDetailedDto, string>({
            query: (id) => ({
                url: getUrl(`/${id}`),
                method: "GET",
            }),
            providesTags: (_, __, id) => [{ type: "Project", id }],
        }),

        getProjectTaskStatusColumns: builder.query<TaskStatusColumnDto[], string>({
            query: (projectId) => ({
                url: getUrl(`/${projectId}${env.PROJECT_TASK_STATUS_COLUMNS_SUFFIX}`),
                method: "GET",
            }),
            providesTags: (_, __, projectId) => [{ type: "TaskStatusColumns", id: projectId }],
        }),

        createProjectTaskStatusColumn: builder.mutation<
            string,
            {
                projectId: string;
                name: string;
                colorHex?: string | null;
                semanticKind?: number;
                isDoneColumn?: boolean;
                isBlockedColumn?: boolean;
            }
        >({
            query: ({ projectId, name, colorHex, semanticKind, isDoneColumn, isBlockedColumn }) => ({
                url: getUrl(`/${projectId}${env.PROJECT_TASK_STATUS_COLUMNS_SUFFIX}`),
                method: "PUT",
                data: { name, colorHex, semanticKind, isDoneColumn, isBlockedColumn },
            }),
            invalidatesTags: (_, __, { projectId }) => [{ type: "TaskStatusColumns", id: projectId }],
        }),

        reorderProjectTaskStatusColumns: builder.mutation<
            void,
            { projectId: string; orderedColumnIds: string[] }
        >({
            query: ({ projectId, orderedColumnIds }) => ({
                url: getUrl(`/${projectId}/task-status-columns/reorder`),
                method: "PATCH",
                data: { orderedColumnIds },
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "TaskStatusColumns", id: projectId },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        updateProjectTaskStatusColumn: builder.mutation<
            void,
            { projectId: string; columnId: string; name: string; colorHex?: string | null }
        >({
            query: ({ projectId, columnId, name, colorHex }) => ({
                url: getUrl(`/${projectId}/task-status-columns/${columnId}`),
                method: "PATCH",
                data: { name, colorHex },
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "TaskStatusColumns", id: projectId },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        deleteProjectTaskStatusColumn: builder.mutation<
            void,
            { projectId: string; columnId: string; moveTasksToColumnId?: string }
        >({
            query: ({ projectId, columnId, moveTasksToColumnId }) => ({
                url: getUrl(
                    `/${projectId}/task-status-columns/${columnId}${
                        moveTasksToColumnId
                            ? `?moveTasksToColumnId=${encodeURIComponent(moveTasksToColumnId)}`
                            : ""
                    }`,
                ),
                method: "DELETE",
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "TaskStatusColumns", id: projectId },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        createProject: builder.mutation<string, CreateProjectRequest>({
            query: (data) => ({
                url: getUrl(""),
                method: "PUT",
                data,
            }),
            invalidatesTags: [{ type: "Project", id: "LIST" }, "Project"],
        }),

        updateProject: builder.mutation<void, UpdateProjectRequest & { id: string }>({
            query: ({ id, ...data }) => ({
                url: getUrl(`/${id}`),
                method: "PATCH",
                data,
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: "Project", id },
                { type: "Project", id: "LIST" },
                "Project",
            ],
        }),

        deleteProject: builder.mutation<void, string>({
            query: (id) => ({
                url: getUrl(`/${id}`),
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Project", id: "LIST" }, "Project"],
        }),

        getProjectHistory: builder.query<ProjectHistoryEntryDto[], string>({
            query: (projectId) => ({
                url: getUrl(`/${projectId}${env.PROJECTS_HISTORY_SUFFIX}`),
                method: "GET",
            }),
            providesTags: (_, __, projectId) => [
                { type: "ProjectHistory" as const, id: projectId },
            ],
        }),

        getProjectComments: builder.query<ProjectCommentDto[], string>({
            query: (projectId) => ({
                url: getUrl(`/${projectId}${env.PROJECTS_COMMENTS_SUFFIX}`),
                method: "GET",
            }),
            providesTags: (_, __, projectId) => [
                { type: "ProjectComment" as const, id: projectId },
            ],
        }),

        addProjectComment: builder.mutation<
            { id: string; createdAt: string },
            { projectId: string; data: CreateProjectCommentRequest }
        >({
            query: ({ projectId, data }) => ({
                url: getUrl(`/${projectId}${env.PROJECTS_COMMENTS_SUFFIX}`),
                method: "PUT",
                data,
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "ProjectComment" as const, id: projectId },
                { type: "Project" as const, id: projectId },
            ],
        }),

        uploadProjectCommentAttachments: builder.mutation<
            unknown,
            { commentId: string; projectId: string; files: File[] }
        >({
            query: ({ commentId, files }) => {
                const fd = new FormData();
                files.forEach((f) => fd.append("files", f, f.name));
                return {
                    url: getUrl(`/comments/${commentId}/attachments`),
                    method: "POST",
                    data: fd,
                };
            },
            invalidatesTags: (_, __, { projectId }) => [
                { type: "ProjectComment" as const, id: projectId },
            ],
        }),

        updateProjectComment: builder.mutation<
            void,
            { id: string; data: UpdateProjectCommentRequest }
        >({
            query: ({ id, data }) => ({
                url: getUrl(`${env.PROJECT_COMMENT_BY_ID_PREFIX}/${id}`),
                method: "PATCH",
                data,
            }),
            invalidatesTags: ["ProjectComment"],
        }),

        deleteProjectComment: builder.mutation<
            void,
            { commentId: string; projectId: string }
        >({
            query: ({ commentId }) => ({
                url: getUrl(`${env.PROJECT_COMMENT_BY_ID_PREFIX}/${commentId}`),
                method: "DELETE",
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "ProjectComment", id: projectId },
                { type: "Project", id: projectId },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetProjectsQuery,
    useGetProjectByIdQuery,
    useGetProjectTaskStatusColumnsQuery,
    useCreateProjectTaskStatusColumnMutation,
    useReorderProjectTaskStatusColumnsMutation,
    useUpdateProjectTaskStatusColumnMutation,
    useDeleteProjectTaskStatusColumnMutation,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
    useGetProjectHistoryQuery,
    useGetProjectCommentsQuery,
    useAddProjectCommentMutation,
    useUploadProjectCommentAttachmentsMutation,
    useUpdateProjectCommentMutation,
    useDeleteProjectCommentMutation,
} = projectsApi;
