import type { ProjectTaskPriority } from "../enums/ProjectTaskPriority";

export interface UpdateTaskRequest {
    id: string;
    title?: string | null;
    projectTaskStatusColumnId?: string | null;
    priority?: ProjectTaskPriority | null;
    deadline?: string | null;
    description?: string | null;
    projectId: string;
    parentTaskId?: string | null;
    responsibleId?: string | null;
    sortOrder?: number | null;
    watcherUserIds?: string[] | null;
    tagIds?: string[] | null;
}
