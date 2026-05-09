import type { ProjectTaskPriority } from "../enums/ProjectTaskPriority";

export interface CreateTaskRequest {
    title: string;
    description?: string | null;
    projectTaskStatusColumnId: string;
    priority: ProjectTaskPriority;
    projectId: string;
    assigneeId?: string | null;
    responsibleId?: string | null;
    deadline?: string | null;
    watcherUserIds?: string[] | null;
    tagIds?: string[] | null;
}
