import { api } from "@/shared/lib";
import { env } from "@/env";
import { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";
import { TaskDetailedDto } from "@/types/dto/tasks/TaskDetailedDto";
import { CreateTaskRequest } from "@/types/dto/tasks/CreateTaskRequest";
import { UpdateTaskRequest } from "@/types/dto/tasks/UpdateTaskRequest";
import { ChangeTaskStatusCommand } from "@/types/dto/tasks/ChangeTaskStatusCommand";
import { AddTaskCommentRequest } from "@/types/dto/taskComments/AddTaskCommentRequest";
import { UpdateTaskCommentRequest } from "@/types/dto/taskComments/UpdateTaskCommentRequest";
import { DeleteTaskCommentRequest } from "@/types/dto/taskComments/DeleteTaskCommentRequest";
import type { CommentAttachmentDto } from "@/types/dto/attachments/CommentAttachmentDto";

const taskBase = env.API_TASK_PATH;
const taskCommentsBase = env.API_TASK_COMMENTS_PATH;

export const tasksApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTasksByProject: builder.query<TaskShortDto[], string>({
            query: (projectId) => ({
                url: `${taskBase}/project/${projectId}`,
                method: "GET",
            }),
            providesTags: (result, _, projectId) => [
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
                ...(result?.map(({ id }) => ({ type: "Task" as const, id })) ?? []),
            ],
        }),

        getTaskById: builder.query<TaskDetailedDto, string>({
            query: (taskId) => ({
                url: `${taskBase}/${taskId}`,
                method: "GET",
            }),
            providesTags: (_, __, id) => [{ type: "Task", id }],
        }),

        createTask: builder.mutation<string, CreateTaskRequest>({
            query: (body) => ({
                url: taskBase,
                method: "PUT",
                data: {
                    title: body.title,
                    description: body.description ?? null,
                    projectTaskStatusColumnId: body.projectTaskStatusColumnId,
                    priority: body.priority,
                    projectId: body.projectId,
                    assigneeId: body.assigneeId ?? null,
                    responsibleId: body.responsibleId ?? null,
                    deadline: body.deadline ?? null,
                    watcherUserIds: body.watcherUserIds ?? null,
                    tagIds: body.tagIds?.length ? body.tagIds : null,
                },
            }),
            invalidatesTags: (_, __, { projectId }) => [
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        updateTask: builder.mutation<void, UpdateTaskRequest>({
            query: (body) => ({
                url: `${taskBase}/${body.id}`,
                method: "PATCH",
                data: {
                    id: body.id,
                    title: body.title ?? null,
                    projectTaskStatusColumnId: body.projectTaskStatusColumnId ?? null,
                    priority: body.priority ?? null,
                    deadline: body.deadline ?? null,
                    description: body.description ?? null,
                    projectId: body.projectId,
                    parentTaskId: body.parentTaskId ?? null,
                    responsibleId: body.responsibleId ?? null,
                    sortOrder: body.sortOrder ?? null,
                    watcherUserIds: body.watcherUserIds ?? null,
                    tagIds: body.tagIds !== undefined ? body.tagIds : null,
                },
            }),
            invalidatesTags: (_, __, { id, projectId }) => [
                { type: "Task", id },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        deleteTask: builder.mutation<void, { id: string; projectId: string }>({
            query: ({ id }) => ({
                url: `${taskBase}/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_, __, { id, projectId }) => [
                { type: "Task", id },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        assignUser: builder.mutation<
            void,
            { taskId: string; assigneeId: string | null; projectId: string }
        >({
            query: (body) => ({
                url: `${taskBase}/assign`,
                method: "POST",
                data: { taskId: body.taskId, assigneeId: body.assigneeId },
            }),
            invalidatesTags: (_, __, { taskId, projectId }) => [
                { type: "Task", id: taskId },
                { type: "Task", id: "LIST" },
                { type: "Project", id: projectId },
            ],
        }),

        changeTaskStatus: builder.mutation<void, ChangeTaskStatusCommand>({
            query: (body) => ({
                url: `${taskBase}/status`,
                method: "POST",
                data: {
                    taskId: body.taskId,
                    projectId: body.projectId,
                    newStatusColumnId: body.newStatusColumnId,
                    newSortOrder: body.newSortOrder ?? null,
                },
            }),
            invalidatesTags: (_, __, arg) => [
                { type: "Task", id: arg.taskId },
                { type: "Task", id: "LIST" },
                { type: "Project", id: arg.projectId },
            ],
        }),

        addTaskComment: builder.mutation<string, AddTaskCommentRequest>({
            query: (body) => ({
                url: taskCommentsBase,
                method: "PUT",
                data: body,
            }),
            invalidatesTags: (_, __, { taskId }) => [{ type: "Task", id: taskId }],
        }),

        uploadTaskCommentAttachments: builder.mutation<
            unknown,
            { commentId: string; files: File[]; taskId: string }
        >({
            query: ({ commentId, files }) => {
                const fd = new FormData();
                files.forEach((f) => fd.append("files", f, f.name));
                return {
                    url: `${taskCommentsBase}/${commentId}/attachments`,
                    method: "POST",
                    data: fd,
                };
            },
            invalidatesTags: (_, __, { taskId }) => [{ type: "Task", id: taskId }],
        }),

        updateTaskComment: builder.mutation<void, UpdateTaskCommentRequest>({
            query: (body) => ({
                url: taskCommentsBase,
                method: "PATCH",
                data: body,
            }),
            invalidatesTags: ["Task"],
        }),

        deleteTaskComment: builder.mutation<void, DeleteTaskCommentRequest>({
            query: ({ id }) => ({
                url: `${taskCommentsBase}/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Task"],
        }),

        uploadTaskAttachments: builder.mutation<CommentAttachmentDto[], { taskId: string; files: File[] }>({
            query: ({ taskId, files }) => {
                const fd = new FormData();
                files.forEach((f) => fd.append("files", f, f.name));
                return {
                    url: `${taskBase}/${taskId}/attachments`,
                    method: "POST",
                    data: fd,
                };
            },
            invalidatesTags: (_, __, { taskId }) => [{ type: "Task", id: taskId }],
        }),
    }),
});

export const {
    useGetTasksByProjectQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useAssignUserMutation,
    useChangeTaskStatusMutation,
    useAddTaskCommentMutation,
    useUploadTaskCommentAttachmentsMutation,
    useUpdateTaskCommentMutation,
    useDeleteTaskCommentMutation,
    useUploadTaskAttachmentsMutation,
} = tasksApi;
