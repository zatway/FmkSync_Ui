"use client"

import {NavLink, useLocation, useNavigate} from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/shared/ui_shadcn/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui_shadcn/accordion'
import { useLogoutMutation } from '@/modules/auth/api/authApi'
import { cn } from '@/shared/lib/ui_shadcn/utils'
import { sidebarItems } from '@/widgets/sidebar/SidebarItems'
import { AccordionProjectsItem } from '@/modules/projects'
import { authLocalService } from '@/shared/lib'
import { UserRole } from '@/types/dto/enums/UserRole'
import {Logo} from "@/shared/ui/Logo/Logo";
import {useTheme} from "@/shared/hooks";
import {AppRoutes} from "@/app/routes/AppRoutes";

type Props = {
    collapsed: boolean
    onToggleCollapse: () => void
    onNavigate?: () => void
}

const Sidebar = ({ collapsed, onToggleCollapse, onNavigate }: Props) => {
    const [logout] = useLogoutMutation()
    const { theme } = useTheme()
    const location = useLocation()
    const navagigation = useNavigate()
    const isAdmin = authLocalService.getUserRole() === UserRole.Admin
    const items = sidebarItems.filter((i) => i.path !== '/admin' || isAdmin)
    const defaultOpen = items.find((item) => item.children?.some((child) => location.pathname.startsWith(child.path || '')))?.label

    const linkClass = (isActive: boolean) =>
        cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent',
            isActive && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center'
        )

    return (
        <aside className='bg-card flex h-full min-h-0 w-full flex-col'>
            <div className={cn('flex items-center border-b p-3', collapsed ? 'justify-center' : 'justify-between gap-2')}>
                <div onClick={() => navagigation(AppRoutes.PROJECTS)} className={cn('overflow-hidden transition-all duration-300 cursor-pointer', collapsed ? 'w-0 opacity-0 md:w-0' : 'w-[140px] opacity-100')}>
                    <Logo mode={theme} height={40} width={140}/>
                </div>
                <Button
                    size='icon'
                    variant='ghost'
                    className='hidden shrink-0 md:inline-flex'
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </Button>
            </div>
            <nav className='flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden p-3'>
                <Accordion type='single' collapsible defaultValue={defaultOpen} className='flex flex-col gap-1'>
                    <AccordionProjectsItem collapsed={collapsed} onNavigate={onNavigate} />
                    {items.map((item) => {
                        const Icon = item.icon
                        const hasChildren = !!item.children?.length
                        if (!hasChildren && item.path) {
                            return (
                                <NavLink
                                    key={item.label}
                                    to={item.path}
                                    onClick={onNavigate}
                                    className={({ isActive }) => linkClass(isActive)}
                                >
                                    {Icon && <Icon size={20} className='min-w-[20px]' />}
                                    {!collapsed && <span className='truncate'>{item.label}</span>}
                                </NavLink>
                            )
                        }
                        return (
                            <AccordionItem key={item.label} value={item.label} className='border-none'>
                                <AccordionTrigger className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent hover:no-underline', collapsed && 'justify-center px-0')} disabled={collapsed}>
                                    <div className='flex flex-1 items-center gap-3'>
                                        {Icon && <Icon size={20} className='min-w-[20px]' />}
                                        {!collapsed && <span className='truncate'>{item.label}</span>}
                                    </div>
                                </AccordionTrigger>
                                {!collapsed && (
                                    <AccordionContent className='pb-1 pl-8'>
                                        {item.children?.map((child) => (
                                            <NavLink key={child.label} to={child.path!} onClick={onNavigate}>
                                                {child.label}
                                            </NavLink>
                                        ))}
                                    </AccordionContent>
                                )}
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </nav>
            <div className='p-3 border-t mt-auto'>
                <Button variant='ghost' className={cn('w-full justify-start gap-2', collapsed && 'justify-center')} onClick={() => void logout()}>
                    <LogOut size={18} /> {!collapsed && 'Выйти'}
                </Button>
            </div>
        </aside>
    )
}

export default Sidebar
