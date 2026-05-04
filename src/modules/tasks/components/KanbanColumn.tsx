import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/shared/lib/ui_shadcn/utils"
import { ColumnHeader } from "./ColumnHeader"
import type { TaskShortDto } from "@/types/dto/tasks/TaskShortDto"
import type { ReactNode } from "react"

interface KanbanColumnProps {
    id: string
    title: string
    tasks: TaskShortDto[]
    children: ReactNode
    color?: "blue" | "purple" | "amber" | "emerald" | "slate"
}

export function KanbanColumn({
                                 id,
                                 title,
                                 tasks,
                                 children,
                                 color = "slate",
                             }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div
            className={cn(
                "flex max-h-[min(70dvh,720px)] min-h-0 min-w-[min(100%,280px)] max-w-[340px] flex-col overflow-hidden rounded-xl border border-border/30 bg-card bg-muted/20 shadow-sm sm:min-w-[340px]",
            )}
        >
            <ColumnHeader title={title} count={tasks.length} color={color} />

            <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div
                    ref={setNodeRef}
                    className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]"
                >
                    {children}
                </div>
            </SortableContext>
        </div>
    )
}
