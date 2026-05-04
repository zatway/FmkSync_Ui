import type { ProjectTaskPriority } from "../enums/ProjectTaskPriority";
import type { TaskStatusColumnDto } from "./TaskStatusColumnDto";

export interface TaskAssigneeDto {
    id: string;
    name: string;
    avatarUrl?: string | null;
    hasAvatar?: boolean;
}

export interface TaskShortDto {
    id: string;
    key: string;
    title: string;
    description?: string | null;
    status: TaskStatusColumnDto;
    priority: ProjectTaskPriority;
    projectId: string;
    creatorId: string;
    createdAt: string;
    updatedAt?: string | null;
    deadline?: string | null;
    taskNumber: number;
    sortOrder: number;
    assignee?: TaskAssigneeDto | null;
    responsible?: TaskAssigneeDto | null;
}
