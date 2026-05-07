import {TaskHistoryAction} from "../enums/TaskHistoryAction.ts";

export interface TaskHistoryDto {
    id: string;
    taskId: string;
    changedById?: string | null;
    changedByName?: string | null;
    changedByHasAvatar?: boolean;
    propertyName: string;
    oldValue?: string | null;
    newValue?: string | null;
    action: TaskHistoryAction;
    changedAt: string;
}
