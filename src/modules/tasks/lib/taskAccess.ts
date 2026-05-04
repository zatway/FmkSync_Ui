import { UserRole } from '@/types/dto/enums/UserRole'

/** Редактирование / смена статуса / исполнитель / удаление задачи (согласовано с бэкендом TaskAccessRules). */
export function canMutateTask(
    role: UserRole | null | undefined,
    currentUserId: string | null | undefined,
    task: { creatorId: string },
): boolean {
    if (role === UserRole.ReadOnly) return false
    if (role === UserRole.Admin || role === UserRole.Manager) return true
    if (role === UserRole.Employee) return Boolean(currentUserId && task.creatorId === currentUserId)
    return false
}

export function canCreateTasks(role: UserRole | null | undefined): boolean {
    return role !== UserRole.ReadOnly && role != null
}
