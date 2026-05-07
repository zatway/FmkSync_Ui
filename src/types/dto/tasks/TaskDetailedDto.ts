import type { TaskAssigneeDto, TaskShortDto } from "./TaskShortDto";
import type { TaskCommentDto } from "../taskComments/TaskCommentDto";
import type { TaskHistoryDto } from "../taskHistory/TaskHistoryDto";

export interface TaskDetailedDto extends TaskShortDto {
    /** Автор задачи (для отображения и прав сотрудника). */
    creator?: TaskAssigneeDto | null;
    parentTaskId?: string | null;
    comments: TaskCommentDto[];
    history: TaskHistoryDto[];
    watchers: TaskAssigneeDto[];
    fileAttachments?: Array<{
        id: string;
        fileName: string;
        contentType?: string | null;
        sizeBytes: number;
        createdAt: string;
    }>;
}
