import type { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";

/** Пустой выбор — без фильтра. Иначе задача проходит, если есть хотя бы один из выбранных тегов. */
export function taskMatchesTagFilter(task: TaskShortDto, selectedTagIds: string[]): boolean {
    if (!selectedTagIds.length) return true;
    const want = new Set(selectedTagIds);
    return (task.tags ?? []).some((t) => want.has(t.id));
}
