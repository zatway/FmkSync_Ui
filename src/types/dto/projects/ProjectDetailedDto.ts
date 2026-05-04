export interface ProjectDetailedDto {
    id: string;
    key: string;
    name: string;
    description?: string;          // полное описание (может быть markdown)

    // Даты
    startDate?: string | Date;
    dueDate?: string | Date;
    completedAt?: string | Date;   // дата завершения (если status = completed)

    createdAt: string | Date;
    updatedAt: string | Date;

    color?: string;
    icon?: string;

    // Владелец и участники
    owner: {
        id: string;
        name: string;
        avatarUrl?: string;
        hasAvatar?: boolean;
        email?: string;
        role: "owner" | "admin" | "member";
    };

    members: Array<{
        id: string;
        name: string;
        avatarUrl?: string;
        hasAvatar?: boolean;
        email?: string;
        role: "admin" | "member" | "viewer" | "guest";
        joinedAt: string | Date;
    }>;

    // Статистика задач
    taskStats: {
        total: number;
        open: number;
        inProgress: number;
        review: number;
        done: number;
        blocked: number;
        cancelled: number;
    };

    // Прогресс и метрики
    progress: number;              // 0–100 (обычно считается как done / total)
    overdueTasksCount?: number;
    highPriorityTasksCount?: number;

    // Дополнительные поля (часто полезны в корпоративных системах)
    tags?: string[];               // ["frontend", "mobile", "urgent", "clientX"]
    category?: string;             // "internal", "client", "product", "research"
    department?: string;           // "IT", "Marketing", "HR" и т.д.
    departmentId?: string;

    // Метаданные
    isFavorite?: boolean;          // для текущего пользователя
    isArchived?: boolean;
    projectAttachments?: Array<{
        id: string;
        fileName: string;
        contentType?: string | null;
        sizeBytes: number;
        downloadUrl: string;
        createdAt: string;
    }>;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canManageMembers: boolean;
        canViewHistory: boolean;
        /** Колонки статусов на доске задач */
        canManageTaskColumns?: boolean;
        canCreateTasks?: boolean;
    };

    customFields?: Record<string, unknown>; // для кастомных полей компании
}
