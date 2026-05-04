import type {CSSProperties} from "react";
import {TaskShortDto} from "@/types/dto/tasks/TaskShortDto";
import {Card, CardContent} from "@/shared/ui_shadcn/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui_shadcn/avatar";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {Calendar, AlertCircle, CheckCircle2} from "lucide-react";
import {Button} from "@/shared/ui_shadcn/button";
import {format, parseISO, isPast} from "date-fns";
import {ru} from "date-fns/locale";
import {cn} from "@/shared/lib/ui_shadcn/utils";
import {useNavigate} from "react-router-dom";
import {AppRoutes} from "@/app/routes/AppRoutes";
import {ProjectTaskPriority} from "@/types/dto/enums/ProjectTaskPriority";

export const DND_TASK_ID_PREFIX = "task:";

const priorityClass: Record<ProjectTaskPriority, string> = {
    [ProjectTaskPriority.Critical]: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
    [ProjectTaskPriority.High]: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
    [ProjectTaskPriority.Medium]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
    [ProjectTaskPriority.Low]: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
};

type ContentProps = {
    task: TaskShortDto;
    projectId: string;
    overlayStyle?: boolean;
    doneColumnId?: string | null;
    onCloseTask?: (taskId: string) => void | Promise<void>;
};

function TaskCardContent({task, projectId, overlayStyle, doneColumnId, onCloseTask}: ContentProps) {
    const navigate = useNavigate();
    const due = task.deadline;
    const isOverdue = due && isPast(parseISO(due));

    const openTask = () => {
        navigate(`${AppRoutes.TASKS}/${projectId}/detail/${task.id}`);
    };

    return (
        <Card
            className={cn(
                "shadow-sm",
                overlayStyle && "opacity-95 scale-[1.02] shadow-2xl ring-2 ring-primary/20 cursor-grabbing"
            )}
            onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openTask();
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") openTask();
            }}
        >
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div
                    className="flex-1 min-w-0 space-y-1"
                    role="button"
                    tabIndex={0}
                >
                    <div className="font-medium line-clamp-2">{task.title}</div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground font-mono truncate">{task.key}</span>
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0",
                                priorityClass[task.priority]
                            )}
                        >
                            {task.priority}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {doneColumnId && onCloseTask && !task.status.isDoneColumn && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                aria-label="Закрыть задачу"
                                title="Закрыть задачу"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void onCloseTask(task.id);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <CheckCircle2 className="h-4 w-4"/>
                            </Button>
                        )}
                        {task.assignee && (
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={task.assignee.avatarUrl ?? undefined}/>
                                <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </div>

                {due && (
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <Calendar className="h-3.5 w-3.5 shrink-0"/>
                        <span className={cn(isOverdue && "text-destructive")}>
                            {format(parseISO(due), "d MMM", {locale: ru})}
                        </span>
                        {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0"/>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface SortableProps {
    task: TaskShortDto;
    projectId: string;
    doneColumnId?: string | null;
    onCloseTask?: (taskId: string) => void | Promise<void>;
}

/**
 * Сортатируемая карточка: ref + listeners на нативном div (shadcn Card не forwardRef — ref на Card не работал).
 * @see https://docs.dndkit.com/presets/sortable#usesortable
 */
export function TaskCard({task, projectId, doneColumnId, onCloseTask}: SortableProps) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `${DND_TASK_ID_PREFIX}${task.id}`,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "outline-none rounded-xl",
                "cursor-grab active:cursor-grabbing touch-none",
                isDragging && "opacity-50"
            )}
            {...attributes}
            {...listeners}
        >
            <TaskCardContent
                task={task}
                projectId={projectId}
                doneColumnId={doneColumnId}
                onCloseTask={onCloseTask}
            />
        </div>
    );
}

/** Превью в DragOverlay — без второго useSortable с тем же id. */
export function TaskCardDragOverlay({task, projectId}: SortableProps) {
    return <TaskCardContent task={task} projectId={projectId} overlayStyle/>;
}
