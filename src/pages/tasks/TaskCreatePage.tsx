import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useGetProjectByIdQuery, useGetProjectTaskStatusColumnsQuery } from '@/modules/projects/api/projectsApi'
import { useCreateTaskMutation, useGetTasksByProjectQuery } from '@/modules/tasks/api/tasksApi'
import { mergeTaskFormMemberOptions } from '@/modules/tasks/lib/taskFormMembers'
import { TaskForm, type TaskFormValues } from '@/modules/tasks'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { Button } from '@/shared/ui_shadcn/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/shared/lib'
import { ProjectTaskPriority } from '@/types/dto/enums/ProjectTaskPriority'

export default function TaskCreatePage() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const { data: project } = useGetProjectByIdQuery(projectId!, { skip: !projectId })
    const { data: projectTasks = [] } = useGetTasksByProjectQuery(projectId!, { skip: !projectId })
    const { data: statusColumns = [] } = useGetProjectTaskStatusColumnsQuery(projectId!, { skip: !projectId })
    const [createTask, { isLoading }] = useCreateTaskMutation()

    const members = useMemo(
        () => mergeTaskFormMemberOptions(project, projectTasks),
        [project, projectTasks],
    )

    const onSubmit = async (values: TaskFormValues) => {
        if (!projectId) return
        const deadline = values.deadline ? `${values.deadline}T12:00:00.000Z` : null
        try {
            const id = await createTask({
                title: values.title,
                description: values.description || undefined,
                projectTaskStatusColumnId: values.projectTaskStatusColumnId,
                priority: values.priority,
                projectId,
                assigneeId: values.assigneeId,
                responsibleId: values.responsibleId,
                deadline,
                watcherUserIds: values.watcherIds?.length ? values.watcherIds : null,
                tagIds: values.tagIds?.length ? values.tagIds : null,
            }).unwrap()
            toast.success('Задача создана')
            navigate(`${AppRoutes.TASKS}/${projectId}/detail/${id}`)
        } catch (e) { toast.error(getApiErrorMessage(e)) }
    }

    if (!projectId) return null
    const defaultColumnId = [...statusColumns].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id ?? ''

    return (
        <div className="container mx-auto w-full min-w-0 max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
            <Button variant='ghost' className='mb-6' onClick={() => navigate(-1)}><ArrowLeft className='mr-2 h-4 w-4' />Назад</Button>
            <h1 className='text-2xl font-bold mb-6'>Новая задача</h1>
            {project && !statusColumns.length && (
                <p className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    У проекта нет колонок статусов (старые данные). Добавьте колонки на доске Kanban, затем создайте задачу.
                </p>
            )}
            {project && statusColumns.length > 0 && (
                <TaskForm
                    statusColumns={statusColumns}
                    members={members}
                    projectTags={project.tags ?? []}
                    submitLabel='Создать задачу'
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    defaultValues={{ projectTaskStatusColumnId: defaultColumnId, priority: ProjectTaskPriority.Medium }}
                />
            )}
        </div>
    )
}

