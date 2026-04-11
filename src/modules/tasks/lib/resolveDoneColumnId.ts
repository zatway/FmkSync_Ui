import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";

export function resolveDoneColumnId(columns: TaskStatusColumnDto[]): string | null {
    if (!columns.length) return null;
    const sorted = [...columns].sort((a, b) => a.sortOrder - b.sortOrder);
    const marked = sorted.find((c) => c.isDoneColumn);
    if (marked) return marked.id;
    const bySemantic = sorted.find((c) => c.semanticKind === 3);
    if (bySemantic) return bySemantic.id;
    return null;
}
