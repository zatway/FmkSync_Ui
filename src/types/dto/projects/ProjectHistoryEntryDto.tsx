export interface ProjectHistoryEntryDto {
    id: string;                    // id записи изменения
    field: string;                 // какое поле изменилось ("name", "dueDate", "description" и т.д.)
    oldValue: unknown;             // старое значение
    newValue: unknown;             // новое значение
    changedBy: {
        id: string;
        name: string;
        hasAvatar?: boolean;
    };
    changedAt: string;             // ISO строка
}
