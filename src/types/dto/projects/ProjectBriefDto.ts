export interface ProjectBriefDto {
    id: string;                    // UUID или другой уникальный идентификатор
    key: string;                   // короткий ключ проекта (APP, CRM, WEB25 и т.п.)
    name: string;                  // название проекта
    description?: string;          // краткое описание (часто обрезается до 1-2 строк)

    ownerId: string;               // ID владельца/создателя
    ownerName: string;             // отображаемое имя владельца
    ownerHasAvatar?: boolean;

    memberCount: number;           // сколько участников в проекте
    taskCount: number;             // всего задач
    openTaskCount: number;         // открытых / в работе задач
    completedTaskCount?: number;   // завершённых задач (для прогресс-бара)

    progress?: number;             // 0–100 (можно считать на фронте или бэке)
    dueDate?: string;       // срок сдачи проекта (ISO или Date)
    lastActivityAt?: string;// когда была последняя активность

    createdAt: string;
    updatedAt: string;

    // Для визуального отличия в списке/сайдбаре
    color?: string;                // #HEX или hsl() — цвет метки/иконки проекта
    icon?: string;                 // emoji или путь к иконке (опционально)

    isArchived?: boolean;
}
