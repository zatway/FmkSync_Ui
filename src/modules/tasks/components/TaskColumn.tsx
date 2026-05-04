import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";
import { TaskCard } from "./TaskCard";

interface Props {
    column: { id: string; title: string };
    tasks: TaskShortDto[];
    projectId: string;
}

export function TaskColumn({ column, tasks, projectId }: Props) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className="flex min-w-[min(100%,280px)] max-w-[340px] flex-col rounded-xl bg-muted/40 p-3 sm:min-w-[320px] sm:p-4"
        >
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                {column.title}
                <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </h2>

            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3 min-h-[200px]">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} projectId={projectId} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
