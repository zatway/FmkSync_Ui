import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/ui_shadcn/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui_shadcn/accordion'
import { FolderKanban, GitPullRequestCreate } from 'lucide-react'
import { useGetProjectsQuery } from '@/modules/projects/api/projectsApi'
import { FC } from 'react'
import { AppRoutes } from '@/app/routes/AppRoutes'
import ProjectItem from '@/modules/projects/components/ProjectItem'

interface AccordionProjectsItemProps { collapsed: boolean; onNavigate?: () => void }

const AccordionProjectsItem: FC<AccordionProjectsItemProps> = ({ collapsed, onNavigate }) => {
    const { data: projects } = useGetProjectsQuery()

    return (
        <AccordionItem value='Проекты' className={cn('border-none', collapsed && 'relative')}>
            <AccordionTrigger className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent hover:no-underline', collapsed && 'justify-center px-0')}>
                <div className='flex items-center gap-3 flex-1'><FolderKanban size={20} className='min-w-[20px]' />{!collapsed && 'Проекты'}</div>
            </AccordionTrigger>
            <AccordionContent
                className={cn(
                    'pb-1',
                    collapsed
                        ? 'absolute left-full top-0 z-50 ml-2 w-72 rounded-md border bg-popover p-2 shadow-lg'
                        : 'pl-2'
                )}
            >
                <div className='mb-2 space-y-1'>
                    <NavLink
                        to={AppRoutes.PROJECT_CREATE}
                        onClick={onNavigate}
                        title='Создать проект'
                        className={({ isActive }) =>
                            cn(
                                'flex items-center rounded-md py-1.5 text-sm hover:bg-accent/70',
                                collapsed ? 'gap-2 px-3' : 'gap-2 px-3',
                                isActive && 'bg-accent/80'
                            )
                        }
                    >
                        <GitPullRequestCreate size={14} />
                        {'Создать проект'}
                    </NavLink>
                </div>
                <div className='space-y-1'>
                    {projects?.map((p) => (
                        <ProjectItem key={p.id} project={p} isCollapsed={false} onNavigate={onNavigate} />
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

export default AccordionProjectsItem

