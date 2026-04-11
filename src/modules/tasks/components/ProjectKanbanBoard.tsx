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
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import {
    useChangeTaskStatusMutation,
    useGetTasksByProjectQuery,
} from "@/modules/tasks/api/tasksApi";
import {
    useGetProjectTaskStatusColumnsQuery,
    useCreateProjectTaskStatusColumnMutation,
    useReorderProjectTaskStatusColumnsMutation,
    useUpdateProjectTaskStatusColumnMutation,
    useDeleteProjectTaskStatusColumnMutation,
} from "@/modules/projects/api/projectsApi";
import { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";
import { DND_TASK_ID_PREFIX, TaskCard, TaskCardDragOverlay } from "./TaskCard";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";
import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { resolveDoneColumnId } from "@/modules/tasks/lib/resolveDoneColumnId";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui_shadcn/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui_shadcn/dialog";
import { Label } from "@/shared/ui_shadcn/label";

/** Префикс id колонки для @dnd-kit (не пересекается с task id). */
const DND_COL_PREFIX = "col:";

function parseDragId(id: string): { kind: "task"; uuid: string } | { kind: "column"; uuid: string } | null {
    if (id.startsWith(DND_TASK_ID_PREFIX)) {
        return { kind: "task", uuid: id.slice(DND_TASK_ID_PREFIX.length) };
    }
    if (id.startsWith(DND_COL_PREFIX)) {
        return { kind: "column", uuid: id.slice(DND_COL_PREFIX.length) };
    }
    return null;
}

interface ProjectKanbanBoardProps {
    projectId: string;
}

export default function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
    const { data: serverTasks = [], isFetching } = useGetTasksByProjectQuery(projectId);
    const { data: statusColumns = [], isFetching: colsLoading } = useGetProjectTaskStatusColumnsQuery(
        projectId,
        { skip: !projectId },
    );
    const [changeStatus] = useChangeTaskStatusMutation();
    const [createColumn, { isLoading: creatingCol }] = useCreateProjectTaskStatusColumnMutation();
    const [reorderColumns] = useReorderProjectTaskStatusColumnsMutation();
    const [updateColumn, { isLoading: updatingCol }] = useUpdateProjectTaskStatusColumnMutation();
    const [deleteColumn, { isLoading: deletingCol }] = useDeleteProjectTaskStatusColumnMutation();
    const navigate = useNavigate();

    const sortedColumns = useMemo(
        () => [...statusColumns].sort((a, b) => a.sortOrder - b.sortOrder),
        [statusColumns],
    );

    const doneColumnId = useMemo(() => resolveDoneColumnId(sortedColumns), [sortedColumns]);

    const [columns, setColumns] = useState<Record<string, TaskShortDto[]>>({});
    const [activeTask, setActiveTask] = useState<TaskShortDto | null>(null);
    const [activeColumn, setActiveColumn] = useState<TaskStatusColumnDto | null>(null);
    const [newColName, setNewColName] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");
    const [columnBeingEdited, setColumnBeingEdited] = useState<TaskStatusColumnDto | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [columnBeingDeleted, setColumnBeingDeleted] = useState<TaskStatusColumnDto | null>(null);

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
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const openEdit = (col: TaskStatusColumnDto) => {
        setColumnBeingEdited(col);
        setEditName(col.name);
        setEditColor(col.colorHex?.trim() ?? "");
        setEditOpen(true);
    };

    const submitEdit = async () => {
        if (!columnBeingEdited) return;
        const name = editName.trim();
        if (!name) {
            toast.error("Укажите название");
            return;
        }
        try {
            await updateColumn({
                projectId,
                columnId: columnBeingEdited.id,
                name,
                colorHex: editColor.trim() || null,
            }).unwrap();
            toast.success("Колонка обновлена");
            setEditOpen(false);
            setColumnBeingEdited(null);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const confirmDelete = async () => {
        if (!columnBeingDeleted) return;
        try {
            await deleteColumn({ projectId, columnId: columnBeingDeleted.id }).unwrap();
            toast.success("Колонка удалена");
            setDeleteOpen(false);
            setColumnBeingDeleted(null);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTask(null);
        setActiveColumn(null);
        const p = parseDragId(String(event.active.id));
        if (p?.kind === "task") {
            const task = tasksById.get(p.uuid);
            if (task) setActiveTask(task);
        } else if (p?.kind === "column") {
            const col = sortedColumns.find((c) => c.id === p.uuid);
            if (col) setActiveColumn(col);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);
        if (!over) return;

        const activeParsed = parseDragId(String(active.id));
        const overParsed = parseDragId(String(over.id));
        if (!activeParsed || !overParsed) return;

        if (activeParsed.kind === "column" && overParsed.kind === "column") {
            if (activeParsed.uuid === overParsed.uuid) return;
            const oldIndex = sortedColumns.findIndex((c) => c.id === activeParsed.uuid);
            const newIndex = sortedColumns.findIndex((c) => c.id === overParsed.uuid);
            if (oldIndex < 0 || newIndex < 0) return;
            const reordered = arrayMove(sortedColumns, oldIndex, newIndex);
            try {
                await reorderColumns({
                    projectId,
                    orderedColumnIds: reordered.map((c) => c.id),
                }).unwrap();
                toast.success("Порядок колонок сохранён");
            } catch (e) {
                toast.error(getApiErrorMessage(e));
            }
            return;
        }

        if (activeParsed.kind !== "task") return;

        const activeTaskId = activeParsed.uuid;
        const activeTaskRow = tasksById.get(activeTaskId);
        if (!activeTaskRow) return;

        let newStatusColumnId = activeTaskRow.status.id;
        let newOrder = activeTaskRow.sortOrder;

        if (overParsed.kind === "column") {
            newStatusColumnId = overParsed.uuid;
            const others = (columns[newStatusColumnId] ?? []).filter((t) => t.id !== activeTaskId);
            newOrder = others.length;
        } else {
            const overTask = tasksById.get(overParsed.uuid);
            if (overTask) {
                newStatusColumnId = overTask.status.id;
                const columnTasks = (columns[newStatusColumnId] ?? []).filter((t) => t.id !== activeTaskId);
                const overIndex = columnTasks.findIndex((t) => t.id === overParsed.uuid);
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
            toast.error("Нет колонки для закрытых задач. Отметьте колонку «Закрыто» (готово).");
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

    const columnIds = useMemo(() => sortedColumns.map((c) => `${DND_COL_PREFIX}${c.id}`), [sortedColumns]);

    return (
        <div className="min-h-0 space-y-4">
            <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
                <div className="mr-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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

            <p className="text-xs text-muted-foreground">
                Перетаскивайте колонки за иконку ⋮⋮, карточки задач — за саму карточку.
            </p>

            {(isFetching || colsLoading) && <p className="text-sm text-muted-foreground">Загрузка…</p>}

            {!sortedColumns.length && !colsLoading && (
                <p className="text-sm text-muted-foreground">Нет колонок статусов для проекта. Добавьте колонку выше.</p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    <div
                        className={cn(
                            "flex min-h-0 gap-4 overflow-x-auto pb-8 sm:gap-6",
                            "snap-x snap-mandatory sm:snap-none -mx-2 px-2 sm:mx-0 sm:px-0",
                        )}
                    >
                        {sortedColumns.map((column) => (
                            <SortableKanbanColumn
                                key={column.id}
                                column={column}
                                tasks={columns[column.id] ?? []}
                                projectId={projectId}
                                doneColumnId={doneColumnId}
                                onCloseTask={handleCloseTask}
                                canDelete={sortedColumns.length > 3}
                                onEdit={() => openEdit(column)}
                                onRequestDelete={() => {
                                    setColumnBeingDeleted(column);
                                    setDeleteOpen(true);
                                }}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                    {activeTask ? <TaskCardDragOverlay task={activeTask} projectId={projectId} /> : null}
                    {activeColumn ? (
                        <div className="bg-muted/90 w-[min(100vw-2rem,340px)] rounded-xl border border-border p-4 shadow-lg sm:w-[340px]">
                            <p className="font-semibold">{activeColumn.name}</p>
                            <p className="text-xs text-muted-foreground">Колонка</p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md" showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Редактировать колонку</DialogTitle>
                        <DialogDescription>Название и цвет отображения (необязательно).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="col-name">Название</Label>
                            <Input
                                id="col-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                maxLength={120}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="col-color">Цвет (#RRGGBB)</Label>
                            <Input
                                id="col-color"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                placeholder="#6366f1"
                                maxLength={8}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="button" onClick={() => void submitEdit()} disabled={updatingCol}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md" showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Удалить колонку?</DialogTitle>
                        <DialogDescription>
                            {columnBeingDeleted ? (
                                <>
                                    Колонка «{columnBeingDeleted.name}» будет удалена. Задачи из неё будут перенесены в
                                    соседнюю колонку (слева или справа).
                                </>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void confirmDelete()}
                            disabled={deletingCol}
                        >
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SortableKanbanColumn({
    column,
    tasks,
    projectId,
    doneColumnId,
    onCloseTask,
    canDelete,
    onEdit,
    onRequestDelete,
}: {
    column: TaskStatusColumnDto;
    tasks: TaskShortDto[];
    projectId: string;
    doneColumnId: string | null;
    onCloseTask: (taskId: string) => void | Promise<void>;
    canDelete: boolean;
    onEdit: () => void;
    onRequestDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${DND_COL_PREFIX}${column.id}`,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const taskIds = useMemo(() => tasks.map((t) => `${DND_TASK_ID_PREFIX}${t.id}`), [tasks]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "border-border/40 bg-muted/40 flex w-[min(100vw-2rem,340px)] shrink-0 snap-start flex-col rounded-xl border p-3 sm:w-[340px] sm:p-4",
                isDragging && "opacity-60",
            )}
        >
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <button
                    type="button"
                    className={cn(
                        "text-muted-foreground hover:text-foreground touch-none rounded-md p-1",
                        "cursor-grab active:cursor-grabbing",
                    )}
                    aria-label="Переместить колонку"
                    title="Переместить колонку"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <h2 className="flex min-w-0 flex-1 items-center gap-2 text-base font-semibold sm:text-lg">
                    <span className="truncate">{column.name}</span>
                    <span className="bg-background text-muted-foreground shrink-0 rounded-full px-2 py-1 text-xs sm:text-sm">
                        {tasks.length}
                    </span>
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Действия с колонкой</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!canDelete} onClick={onRequestDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {!canDelete ? "Нельзя удалить (мин. 3 колонки)" : "Удалить"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
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
