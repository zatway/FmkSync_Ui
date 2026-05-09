/**
 * Отображаемое имя служебной учётки из сида (SeedAdmin / SeedAdmin__FullName, по умолчанию «System Admin»).
 * Совпадает с проверкой на бэкенде (Application.Common.SystemUserDisplayName).
 */
export function isSystemSeededAdminDisplayName(name: string | null | undefined): boolean {
    if (!name?.trim()) return false;
    return name.trim().toLowerCase() === "system admin";
}
