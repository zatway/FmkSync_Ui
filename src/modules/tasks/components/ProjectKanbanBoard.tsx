"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
    useChangeTaskStatusMutation,
    useGetTasksByProjectQuery,
} from "@/modules/tasks/api/tasksApi";
import {
    useGetProjectTaskStatusColumnsQuery,
    useCreateProjectTaskStatusColumnMutation,
} from "@/modules/projects/api/projectsApi";
import { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";
import { TaskCard, TaskCardDragOverlay } from "./TaskCard";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";
import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { resolveDoneColumnId } from "@/modules/tasks/lib/resolveDoneColumnId";

interface ProjectKanbanBoardProps {
    projectId: string;
}

export default function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
    const { data: serverTasks = [], isFetching } = useGetTasksByProjectQuery(projectId);
    const { data: statusColumns = [], isFetching: colsLoading } = useGetProjectTaskStatusColumnsQuery(
        projectId,
        { skip: !projectId }
    );
    const [changeStatus] = useChangeTaskStatusMutation();
    const [createColumn, { isLoading: creatingCol }] = useCreateProjectTaskStatusColumnMutation();
    const navigate = useNavigate();

    const sortedColumns = useMemo(
        () => [...statusColumns].sort((a, b) => a.sortOrder - b.sortOrder),
        [statusColumns]
    );

    const doneColumnId = useMemo(() => resolveDoneColumnId(sortedColumns), [sortedColumns]);

    const [columns, setColumns] = useState<Record<string, TaskShortDto[]>>({});
    const [activeTask, setActiveTask] = useState<TaskShortDto | null>(null);
    const [newColName, setNewColName] = useState("");

    const tasksById = useMemo(() => {
        const m = new Map<string, TaskShortDto>();
        serverTasks.forEach((t) => m.set(t.id, t));
        return m;
    }, [serverTasks]);

    useEffect(() => {
        const initial: Record<string, TaskShortDto[]> = {};
        sortedColumns.forEach((c) => {
            initial[c.id] = [];
        });

        serverTasks.forEach((task) => {
            const colId = task.status?.id;
            if (colId && initial[colId]) {
                initial[colId].push(task);
            } else if (sortedColumns[0]) {
                initial[sortedColumns[0].id].push(task);
            }
        });

        sortedColumns.forEach((c) => {
            initial[c.id].sort((a, b) => a.sortOrder - b.sortOrder || a.taskNumber - b.taskNumber);
        });

        setColumns(initial);
    }, [serverTasks, sortedColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasksById.get(String(event.active.id));
        if (task) setActiveTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over) return;

        const activeTaskId = String(active.id);
        const overId = String(over.id);

        const activeTaskRow = tasksById.get(activeTaskId);
        if (!activeTaskRow) return;

        let newStatusColumnId = activeTaskRow.status.id;
        let newOrder = activeTaskRow.sortOrder;

        const columnHit = sortedColumns.find((c) => c.id === overId);
        if (columnHit) {
            newStatusColumnId = columnHit.id;
            const others = (columns[columnHit.id] ?? []).filter((t) => t.id !== activeTaskId);
            newOrder = others.length;
        } else {
            const overTask = tasksById.get(overId);
            if (overTask) {
                newStatusColumnId = overTask.status.id;
                const columnTasks = (columns[newStatusColumnId] ?? []).filter((t) => t.id !== activeTaskId);
                const overIndex = columnTasks.findIndex((t) => t.id === overId);
                newOrder = overIndex >= 0 ? overIndex : columnTasks.length;
            }
        }

        if (newStatusColumnId === activeTaskRow.status.id && newOrder === activeTaskRow.sortOrder) {
            return;
        }

        try {
            await changeStatus({
                taskId: activeTaskId,
                projectId,
                newStatusColumnId,
                newSortOrder: newOrder,
            }).unwrap();
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleCloseTask = async (taskId: string) => {
        if (!doneColumnId) {
            toast.error("Нет колонки для закрытых задач. Отметьте колонку «Готово» или задайте семантику Done.");
            return;
        }
        const taskRow = tasksById.get(taskId);
        if (!taskRow || taskRow.status.isDoneColumn) return;
        const others = (columns[doneColumnId] ?? []).filter((t) => t.id !== taskId);
        const newOrder = others.length;
        try {
            await changeStatus({
                taskId,
                projectId,
                newStatusColumnId: doneColumnId,
                newSortOrder: newOrder,
            }).unwrap();
            toast.success("Задача закрыта");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleAddColumn = async () => {
        const name = newColName.trim();
        if (!name) return;
        try {
            await createColumn({ projectId, name, colorHex: null }).unwrap();
            setNewColName("");
            toast.success("Колонка добавлена");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="space-y-4 min-h-0">
            <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-stretch sm:items-center">
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mr-auto w-full sm:w-auto">
                    <Input
                        placeholder="Новая колонка"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        className="max-w-full sm:max-w-xs"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddColumn}
                        disabled={creatingCol || !newColName.trim() || sortedColumns.length >= 10}
                        title={sortedColumns.length >= 10 ? "Не более 10 колонок" : undefined}
                    >
                        Добавить колонку
                    </Button>
                </div>
                <Button
                    type="button"
                    onClick={() => navigate(`${AppRoutes.TASKS}/${projectId}/create`)}
                    className="shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Новая задача
                </Button>
            </div>

            {(isFetching || colsLoading) && <p className="text-sm text-muted-foreground">Загрузка…</p>}

            {!sortedColumns.length && !colsLoading && (
                <p className="text-sm text-muted-foreground">
                    Нет колонок статусов для проекта. Добавьте колонку выше.
                </p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div
                    className={cn(
                        "flex gap-4 sm:gap-6 overflow-x-auto pb-8 -mx-2 px-2 sm:mx-0 sm:px-0",
                        "snap-x snap-mandatory sm:snap-none min-h-0"
                    )}
                >
                    {sortedColumns.map((column: TaskStatusColumnDto) => (
                        <KanbanColumn
                            key={column.id}
                            column={{ id: column.id, title: column.name }}
                            tasks={columns[column.id] ?? []}
                            projectId={projectId}
                            doneColumnId={doneColumnId}
                            onCloseTask={handleCloseTask}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTask ? <TaskCardDragOverlay task={activeTask} projectId={projectId} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function KanbanColumn({
    column,
    tasks,
    projectId,
    doneColumnId,
    onCloseTask,
}: {
    column: { id: string; title: string };
    tasks: TaskShortDto[];
    projectId: string;
    doneColumnId: string | null;
    onCloseTask: (taskId: string) => void | Promise<void>;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "snap-start shrink-0 w-[min(100vw-2rem,340px)] sm:w-[340px] bg-muted/40 rounded-xl p-3 sm:p-4 flex flex-col border border-border/40",
                isOver && "ring-2 ring-primary/30 h-full"
            )}
        >
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center justify-between gap-2">
                <span className="truncate">{column.title}</span>
                <span className="text-xs sm:text-sm text-muted-foreground bg-background px-2 py-1 rounded-full shrink-0">
                    {tasks.length}
                </span>
            </h2>

            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            projectId={projectId}
                            doneColumnId={doneColumnId}
                            onCloseTask={onCloseTask}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
