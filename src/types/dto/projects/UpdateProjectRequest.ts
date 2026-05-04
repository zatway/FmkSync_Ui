export interface UpdateProjectRequest {
    name?: string;
    key?: string;
    description?: string;
    startDate?: string | null;
    dueDate?: string | null;
    color?: string | null;
    icon?: string | null;
    tags?: string[];
    isArchived?: boolean | null;
    departmentId?: string | null;
}
