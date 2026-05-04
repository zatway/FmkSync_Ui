import type { TaskAssigneeDto, TaskShortDto } from "./TaskShortDto";
import type { TaskCommentDto } from "../taskComments/TaskCommentDto";
import type { TaskHistoryDto } from "../taskHistory/TaskHistoryDto";

export interface TaskDetailedDto extends TaskShortDto {
    /** Автор задачи (для отображения и прав сотрудника). */
    creator?: TaskAssigneeDto | null;
    parentTaskId?: string | null;
    comments: TaskCommentDto[];
    history: TaskHistoryDto[];
    watchers: Array<{ id: string; name: string; avatarUrl?: string | null }>;
    fileAttachments?: Array<{
        id: string;
        fileName: string;
        contentType?: string | null;
        sizeBytes: number;
        downloadUrl: string;
        createdAt: string;
    }>;
}
