import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/widgets/header/Header'
import Sidebar from '@/widgets/sidebar/Sidebar'
import { cn } from '@/shared/lib/ui_shadcn/utils'

const AppLayout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
            <div className="flex min-w-0 flex-1 flex-col max-w-full">
                <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
                <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-x-contain overscroll-y-contain p-3 sm:p-5 lg:p-6">
                    {/* без flex-1: иначе блок растягивается на всю высоту main и даёт прокрутку «в пустоту» на телефонах */}
                    <div className="mx-auto w-full min-w-0 max-w-full min-h-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AppLayout
