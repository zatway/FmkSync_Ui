import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/widgets/header/Header'
import Sidebar from '@/widgets/sidebar/Sidebar'
import { cn } from '@/shared/lib/ui_shadcn/utils'

const AppLayout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-background">
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
                    'fixed inset-y-0 left-0 z-50 w-[min(100vw-3rem,16rem)] border-r bg-card flex flex-col transition-[width,transform] duration-300 md:static md:z-auto md:translate-x-0',
                    sidebarCollapsed ? 'md:w-20' : 'md:w-64',
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
                    onNavigate={() => setMobileNavOpen(false)}
                />
            </aside>
            <div className="flex flex-col flex-1 min-w-0">
                <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AppLayout
