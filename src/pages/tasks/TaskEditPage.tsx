import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useGetProjectByIdQuery, useGetProjectTaskStatusColumnsQuery } from '@/modules/projects/api/projectsApi'
import {
    useGetTaskByIdQuery,
    useGetTasksByProjectQuery,
    useUpdateTaskMutation,
    useAssignUserMutation,
} from '@/modules/tasks/api/tasksApi'
import { mergeTaskFormMemberOptions } from '@/modules/tasks/lib/taskFormMembers'
import { TaskForm, type TaskFormValues } from '@/modules/tasks'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { Button } from '@/shared/ui_shadcn/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/shared/lib'
import { format, parseISO } from 'date-fns'
import { isMeaningfulIsoDate } from '@/shared/lib/dates/meaningfulDate'
import { isSystemSeededAdminDisplayName } from '@/shared/lib/users/systemSeededAdminDisplay'

export default function TaskEditPage() {
    const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
    const navigate = useNavigate()
    const { data: project } = useGetProjectByIdQuery(projectId!, { skip: !projectId })
    const { data: projectTasks = [] } = useGetTasksByProjectQuery(projectId!, { skip: !projectId })
    const { data: statusColumns = [] } = useGetProjectTaskStatusColumnsQuery(projectId!, { skip: !projectId })
    const { data: task, isLoading: taskLoading } = useGetTaskByIdQuery(taskId!, { skip: !taskId })
    const [updateTask, { isLoading }] = useUpdateTaskMutation()
    const [assignUser] = useAssignUserMutation()
    const members = useMemo(
        () => mergeTaskFormMemberOptions(project, projectTasks, task ?? undefined),
        [project, projectTasks, task],
    )

    const onSubmit = async (values: TaskFormValues) => {
        if (!projectId || !taskId) return
        const deadline = values.deadline ? `${values.deadline}T12:00:00.000Z` : null
        try {
            await updateTask({
                id: taskId,
                projectId,
                title: values.title,
                description: values.description || undefined,
                projectTaskStatusColumnId: values.projectTaskStatusColumnId,
                priority: values.priority,
                deadline,
                responsibleId: values.responsibleId,
                watcherUserIds: values.watcherIds ?? [],
                tagIds: values.tagIds ?? [],
            }).unwrap()
            const prevAssignee = task?.assignee?.id ?? null
            const nextAssignee = values.assigneeId ?? null
            if (prevAssignee !== nextAssignee) {
                await assignUser({ taskId, assigneeId: nextAssignee, projectId }).unwrap()
            }
            toast.success('Задача сохранена')
            navigate(`${AppRoutes.TASKS}/${projectId}/detail/${taskId}`)
        } catch (e) { toast.error(getApiErrorMessage(e)) }
    }

    if (!projectId || !taskId) return null
    const deadlineStr =
        task?.deadline && isMeaningfulIsoDate(task.deadline) ? format(parseISO(task.deadline), 'yyyy-MM-dd') : ''

    return (
        <div className="container mx-auto w-full min-w-0 max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
            <Button variant='ghost' className='mb-6' onClick={() => navigate(-1)}><ArrowLeft className='mr-2 h-4 w-4' />Назад</Button>
            <h1 className='text-2xl font-bold mb-6'>Редактирование задачи</h1>
            {taskLoading && <p className='text-muted-foreground'>Загрузка…</p>}
            {task && (
                <TaskForm
                    key={task.id}
                    statusColumns={statusColumns}
                    members={members}
                    projectTags={project?.tags ?? []}
                    submitLabel='Сохранить'
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    defaultValues={{
                        title: task.title,
                        description: task.description ?? '',
                        projectTaskStatusColumnId: task.status.id,
                        priority: task.priority,
                        assigneeId:
                            task.assignee && !isSystemSeededAdminDisplayName(task.assignee.name)
                                ? task.assignee.id
                                : null,
                        responsibleId:
                            task.responsible && !isSystemSeededAdminDisplayName(task.responsible.name)
                                ? task.responsible.id
                                : null,
                        deadline: deadlineStr,
                        watcherIds: task.watchers
                            .filter((w) => !isSystemSeededAdminDisplayName(w.name))
                            .map((w) => w.id),
                        tagIds: (task.tags ?? []).map((t) => t.id),
                    }}
                />
            )}
        </div>
    )
}

