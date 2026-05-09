import type { ProjectDetailedDto } from '@/types/dto/projects/ProjectDetailedDto'
import type { TaskDetailedDto } from '@/types/dto/tasks/TaskDetailedDto'
import type { TaskShortDto } from '@/types/dto/tasks/TaskShortDto'
import { isSystemSeededAdminDisplayName } from '@/shared/lib/users/systemSeededAdminDisplay'

type IdName = { id?: string; Id?: string; name?: string; Name?: string }

function membersFromProjectDto(project: ProjectDetailedDto | undefined): { id: string; name: string }[] {
    if (!project) return []
    const raw =
        project.members ??
        (project as unknown as { Members?: IdName[] | null }).Members ??
        []
    if (!Array.isArray(raw)) return []
    const out: { id: string; name: string }[] = []
    for (const m of raw as IdName[]) {
        const id = m.id ?? m.Id
        const name = m.name ?? m.Name
        if (id && name?.trim() && !isSystemSeededAdminDisplayName(name)) out.push({ id, name: name.trim() })
    }
    return out
}

/** Участники для селектов задачи: владелец + members API + исполнители/ответственные из списка задач + текущая задача (наблюдатели и роли). */
export function mergeTaskFormMemberOptions(
    project: ProjectDetailedDto | undefined,
    tasks?: TaskShortDto[] | undefined,
    detailTask?: TaskDetailedDto | null,
): { id: string; name: string }[] {
    const out: { id: string; name: string }[] = []
    const seen = new Set<string>()
    const push = (id: string | undefined | null, name: string | undefined | null) => {
        if (!id || !name?.trim()) return
        if (isSystemSeededAdminDisplayName(name)) return
        if (seen.has(id)) return
        seen.add(id)
        out.push({ id, name: name.trim() })
    }

    if (project?.owner) push(project.owner.id, project.owner.name)

    for (const m of membersFromProjectDto(project)) push(m.id, m.name)

    for (const t of tasks ?? []) {
        push(t.assignee?.id, t.assignee?.name)
        push(t.responsible?.id, t.responsible?.name)
    }

    if (detailTask) {
        push(detailTask.assignee?.id, detailTask.assignee?.name)
        push(detailTask.responsible?.id, detailTask.responsible?.name)
        for (const w of detailTask.watchers ?? []) push(w.id, w.name)
    }

    return out
}
