import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/widgets/header/Header'
import Sidebar from '@/widgets/sidebar/Sidebar'
import { cn } from '@/shared/lib/ui_shadcn/utils'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

const AppLayout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const isMdUp = useMediaQuery('(min-width: 768px)')
    /** В выезжающем меню на телефоне не используем «узкий» режим с иконками по центру */
    const sidebarCollapsedEffective = isMdUp && sidebarCollapsed

    return (
        <div className="flex h-dvh min-h-0 w-full min-w-0 max-w-full overflow-hidden bg-background">
            {mobileNavOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    aria-label="Закрыть меню"
                    onClick={() => setMobileNavOpen(false)}
                />
            )}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-[min(88vw,17.5rem)] border-r bg-card flex min-h-0 flex-col transition-[width,transform] duration-300 sm:w-64 md:static md:z-auto md:translate-x-0',
                    sidebarCollapsedEffective ? 'md:w-20' : 'md:w-64',
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <Sidebar
                    collapsed={sidebarCollapsedEffective}
                    onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
                    onNavigate={() => setMobileNavOpen(false)}
                />
            </aside>
            <div className="flex min-w-0 flex-1 flex-col max-w-full">
                <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
                <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-x-contain overscroll-y-contain p-3 sm:p-5 lg:p-6">
                    {/* без flex-1: иначе блок растягивается на всю высоту main и даёт прокрутку «в пустоту» на телефонах */}
                    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AppLayout
