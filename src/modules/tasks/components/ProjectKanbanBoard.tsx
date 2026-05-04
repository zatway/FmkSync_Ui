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
    type Modifier,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import {
    useChangeTaskStatusMutation,
    useGetTasksByProjectQuery,
} from "@/modules/tasks/api/tasksApi";
import {
    useGetProjectByIdQuery,
    useGetProjectTaskStatusColumnsQuery,
    useCreateProjectTaskStatusColumnMutation,
    useReorderProjectTaskStatusColumnsMutation,
    useUpdateProjectTaskStatusColumnMutation,
    useDeleteProjectTaskStatusColumnMutation,
} from "@/modules/projects/api/projectsApi";
import { authLocalService } from "@/shared/lib";
import { UserRole } from "@/types/dto/enums/UserRole";
import { canCreateTasks as roleCanCreateTasks, canMutateTask } from "@/modules/tasks/lib/taskAccess";
import { TaskShortDto } from "@/types/dto/tasks/TaskShortDto";
import { DND_TASK_ID_PREFIX, TaskCard, TaskCardDragOverlay } from "./TaskCard";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui_shadcn/select";

const DND_COL_PREFIX = "col:";

function clampTransformToBounds<T extends { x: number; y: number }>(
    transform: T,
    draggingRect: { top: number; left: number; bottom: number; right: number },
    bounds: { top: number; left: number; height: number; width: number },
): T {
    const next = { ...transform };
    const bBottom = bounds.top + bounds.height;
    const bRight = bounds.left + bounds.width;

    if (draggingRect.top + transform.y <= bounds.top) {
        next.y = bounds.top - draggingRect.top;
    } else if (draggingRect.bottom + transform.y >= bBottom) {
        next.y = bBottom - draggingRect.bottom;
    }

    if (draggingRect.left + transform.x <= bounds.left) {
        next.x = bounds.left - draggingRect.left;
    } else if (draggingRect.right + transform.x >= bRight) {
        next.x = bRight - draggingRect.right;
    }

    return next;
}

type NewColumnKind = "0" | "1" | "2" | "3" | "4" | "255";

function columnCreatePayload(kind: NewColumnKind): {
    semanticKind: number;
    isDoneColumn: boolean;
    isBlockedColumn: boolean;
} {
    switch (kind) {
        case "0":
            return { semanticKind: 0, isDoneColumn: false, isBlockedColumn: false };
        case "1":
            return { semanticKind: 1, isDoneColumn: false, isBlockedColumn: false };
        case "2":
            return { semanticKind: 2, isDoneColumn: false, isBlockedColumn: false };
        case "3":
            return { semanticKind: 3, isDoneColumn: true, isBlockedColumn: false };
        case "4":
            return { semanticKind: 4, isDoneColumn: false, isBlockedColumn: true };
        default:
            return { semanticKind: 255, isDoneColumn: false, isBlockedColumn: false };
    }
}

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
    /** Стабильные пустые массивы: `data ?? []` в дефолте аргумента даёт новый [] на каждом рендере → useEffect + setColumns = infinite loop. */
    const emptyColumnsRef = useRef<TaskStatusColumnDto[]>([]);
    /** Видимая полоса с горизонтальным скроллом — ограничиваем drag по левому/правому краю доски (не только окна). */
    const boardStripRef = useRef<HTMLDivElement>(null);

    const { data: serverTasksData, isFetching } = useGetTasksByProjectQuery(projectId);
    const { data: project } = useGetProjectByIdQuery(projectId, { skip: !projectId });
    const { data: statusColumnsData, isFetching: colsLoading } = useGetProjectTaskStatusColumnsQuery(
        projectId,
        { skip: !projectId },
    );
    const role = authLocalService.getUserRole();
    const myUserId = authLocalService.getUserId();
    const perm = project?.permissions;
    const canManageTaskColumns =
        perm?.canManageTaskColumns ?? (role === UserRole.Admin || role === UserRole.Manager);
    const canCreateTasksFlag = perm?.canCreateTasks ?? roleCanCreateTasks(role);
    const statusColumns = statusColumnsData ?? emptyColumnsRef.current;
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

    const hasDoneColumn = useMemo(
        () => sortedColumns.some((c) => c.isDoneColumn || c.semanticKind === 3),
        [sortedColumns],
    );
    const hasBlockedColumn = useMemo(
        () => sortedColumns.some((c) => c.isBlockedColumn || c.semanticKind === 4),
        [sortedColumns],
    );
    const hasInitialColumn = useMemo(
        () =>
            sortedColumns.some(
                (c) => c.semanticKind === 0 && !c.isDoneColumn && !c.isBlockedColumn,
            ),
        [sortedColumns],
    );

    const [columns, setColumns] = useState<Record<string, TaskShortDto[]>>({});
    const [activeTask, setActiveTask] = useState<TaskShortDto | null>(null);
    const [activeColumn, setActiveColumn] = useState<TaskStatusColumnDto | null>(null);
    const [newColName, setNewColName] = useState("");
    const [newColumnKind, setNewColumnKind] = useState<NewColumnKind>("255");

    /** Radix Select: нельзя держать controlled value на disabled item — иначе возможен infinite update loop. */
    useEffect(() => {
        setNewColumnKind((prev) => {
            if (prev === "0" && hasInitialColumn) return "255";
            if (prev === "3" && hasDoneColumn) return "255";
            if (prev === "4" && hasBlockedColumn) return "255";
            return prev;
        });
    }, [hasInitialColumn, hasDoneColumn, hasBlockedColumn]);

    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");
    const [columnBeingEdited, setColumnBeingEdited] = useState<TaskStatusColumnDto | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [columnBeingDeleted, setColumnBeingDeleted] = useState<TaskStatusColumnDto | null>(null);

    const [filterAssigneeId, setFilterAssigneeId] = useState<string>("__all__");
    const [filterResponsibleId, setFilterResponsibleId] = useState<string>("__all__");

    const assigneeFilterOptions = useMemo(() => {
        const m = new Map<string, string>();
        for (const t of serverTasksData ?? []) {
            if (t.assignee?.id) m.set(t.assignee.id, t.assignee.name);
        }
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
    }, [serverTasksData]);

    const responsibleFilterOptions = useMemo(() => {
        const m = new Map<string, string>();
        for (const t of serverTasksData ?? []) {
            if (t.responsible?.id) m.set(t.responsible.id, t.responsible.name);
        }
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
    }, [serverTasksData]);

    const filteredServerTasks = useMemo(() => {
        const list = serverTasksData ?? [];
        return list.filter((t) => {
            if (filterAssigneeId === "__none__") {
                if (t.assignee != null) return false;
            } else if (filterAssigneeId !== "__all__" && t.assignee?.id !== filterAssigneeId) return false;
            if (filterResponsibleId === "__none__") {
                if (t.responsible != null) return false;
            } else if (filterResponsibleId !== "__all__" && t.responsible?.id !== filterResponsibleId) return false;
            return true;
        });
    }, [serverTasksData, filterAssigneeId, filterResponsibleId]);

    const tasksById = useMemo(() => {
        const m = new Map<string, TaskShortDto>();
        filteredServerTasks.forEach((t) => m.set(t.id, t));
        return m;
    }, [filteredServerTasks]);

    useEffect(() => {
        const initial: Record<string, TaskShortDto[]> = {};
        sortedColumns.forEach((c) => {
            initial[c.id] = [];
        });

        filteredServerTasks.forEach((task) => {
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
    }, [filteredServerTasks, sortedColumns]);

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
            if (!canManageTaskColumns) {
                toast.error("Менять порядок колонок могут только администратор или менеджер");
                return;
            }
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
        if (!canMutateTask(role, myUserId, activeTaskRow)) {
            toast.error("Нет прав перемещать или менять эту задачу");
            return;
        }

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
        if (!canMutateTask(role, myUserId, taskRow)) {
            toast.error("Нет прав закрыть эту задачу");
            return;
        }
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
        if (!canManageTaskColumns) {
            toast.error("Добавлять колонки могут только администратор или менеджер");
            return;
        }
        const name = newColName.trim();
        if (!name) return;
        try {
            const payload = columnCreatePayload(newColumnKind);
            await createColumn({ projectId, name, colorHex: null, ...payload }).unwrap();
            setNewColName("");
            setNewColumnKind("255");
            toast.success("Колонка добавлена");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const columnIds = useMemo(() => sortedColumns.map((c) => `${DND_COL_PREFIX}${c.id}`), [sortedColumns]);

    const restrictToKanbanStrip: Modifier = useCallback(({ transform, draggingNodeRect }) => {
        const el = boardStripRef.current;
        if (!draggingNodeRect || !el) return transform;
        const b = el.getBoundingClientRect();
        return clampTransformToBounds(transform, draggingNodeRect, b);
    }, []);

    const dragModifiers = useMemo(
        () => [restrictToKanbanStrip, restrictToWindowEdges],
        [restrictToKanbanStrip],
    );

    /** Иначе @dnd-kit автоскроллит document/main вправо, когда курсор у края — «едет вся страница». */
    const autoScrollCanScroll = useCallback((element: Element) => {
        const strip = boardStripRef.current;
        if (!strip) return false;
        return strip.contains(element);
    }, []);

    const autoScrollOptions = useMemo(
        () => ({
            canScroll: autoScrollCanScroll,
        }),
        [autoScrollCanScroll],
    );

    return (
        <div className="min-h-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="grid gap-1 sm:min-w-[180px]">
                    <Label className="text-xs text-muted-foreground">Исполнитель</Label>
                    <Select value={filterAssigneeId} onValueChange={setFilterAssigneeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Все</SelectItem>
                            <SelectItem value="__none__">Не назначен</SelectItem>
                            {assigneeFilterOptions.map(([id, name]) => (
                                <SelectItem key={id} value={id}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1 sm:min-w-[180px]">
                    <Label className="text-xs text-muted-foreground">Ответственный</Label>
                    <Select value={filterResponsibleId} onValueChange={setFilterResponsibleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Все</SelectItem>
                            <SelectItem value="__none__">Не назначен</SelectItem>
                            {responsibleFilterOptions.map(([id, name]) => (
                                <SelectItem key={id} value={id}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
                {canManageTaskColumns ? (
                    <div className="mr-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <Input
                            placeholder="Новая колонка"
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="max-w-full sm:max-w-xs"
                        />
                        <Select value={newColumnKind} onValueChange={(v) => setNewColumnKind(v as NewColumnKind)}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Тип колонки" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="255">Обычная</SelectItem>
                                <SelectItem value="0" disabled={hasInitialColumn}>
                                    Начальная (backlog)
                                </SelectItem>
                                <SelectItem value="1">В работе</SelectItem>
                                <SelectItem value="2">На проверке</SelectItem>
                                <SelectItem value="3" disabled={hasDoneColumn}>
                                    Завершающая (закрывает задачу)
                                </SelectItem>
                                <SelectItem value="4" disabled={hasBlockedColumn}>
                                    Заблокировано
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                ) : (
                    <div className="mr-auto text-xs text-muted-foreground sm:text-sm">
                        Управление колонками — только у администратора или менеджера.
                    </div>
                )}
                {canCreateTasksFlag ? (
                    <Button
                        type="button"
                        onClick={() => navigate(`${AppRoutes.TASKS}/${projectId}/create`)}
                        className="shrink-0"
                        aria-label="Новая задача"
                    >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Новая задача</span>
                    </Button>
                ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
                {canManageTaskColumns
                    ? "Перетаскивайте колонки за иконку ⋮⋮, карточки задач — за саму карточку (если у вас есть права на задачу)."
                    : "Перетаскивайте только те задачи, которые вам разрешено менять."}
            </p>

            {(isFetching || colsLoading) && <p className="text-sm text-muted-foreground">Загрузка…</p>}

            {!sortedColumns.length && !colsLoading && (
                <p className="text-sm text-muted-foreground">
                    {canManageTaskColumns
                        ? "Нет колонок статусов для проекта. Добавьте колонку выше."
                        : "Нет колонок статусов. Обратитесь к администратору или менеджеру."}
                </p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                modifiers={dragModifiers}
                autoScroll={autoScrollOptions}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    <div
                        ref={boardStripRef}
                        className={cn(
                            "w-full min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain pb-6 pt-0.5 sm:pb-8",
                            "snap-x snap-mandatory sm:snap-none",
                        )}
                    >
                        <div className="flex min-h-0 w-max min-w-0 justify-start gap-3 sm:gap-6">
                        {sortedColumns.map((column) => (
                            <SortableKanbanColumn
                                key={column.id}
                                column={column}
                                tasks={columns[column.id] ?? []}
                                projectId={projectId}
                                doneColumnId={doneColumnId}
                                onCloseTask={handleCloseTask}
                                canDelete={sortedColumns.length > 1}
                                onEdit={() => openEdit(column)}
                                onRequestDelete={() => {
                                    setColumnBeingDeleted(column);
                                    setDeleteOpen(true);
                                }}
                                canManageTaskColumns={canManageTaskColumns}
                                role={role}
                                myUserId={myUserId}
                            />
                        ))}
                        </div>
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                    {activeTask ? <TaskCardDragOverlay task={activeTask} projectId={projectId} /> : null}
                    {activeColumn ? (
                        <div className="bg-muted/90 w-[min(100%,340px)] max-w-[340px] rounded-xl border border-border p-4 shadow-lg sm:w-[340px]">
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
                            <Label htmlFor="col-color">Цвет</Label>
                            <Input
                                id="col-color"
                                type='color'
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
    canManageTaskColumns,
    role,
    myUserId,
}: {
    column: TaskStatusColumnDto;
    tasks: TaskShortDto[];
    projectId: string;
    doneColumnId: string | null;
    onCloseTask: (taskId: string) => void | Promise<void>;
    canDelete: boolean;
    onEdit: () => void;
    onRequestDelete: () => void;
    canManageTaskColumns: boolean;
    role: UserRole | null;
    myUserId: string | null;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${DND_COL_PREFIX}${column.id}`,
        disabled: !canManageTaskColumns,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        borderColor: column.colorHex ?? "transparent",
        transition,
    };

    const taskIds = useMemo(() => tasks.map((t) => `${DND_TASK_ID_PREFIX}${t.id}`), [tasks]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "border-border/40 bg-muted/40 flex w-[min(100%,340px)] max-w-[340px] shrink-0 snap-start flex-col rounded-xl border p-3 sm:w-[340px] sm:max-w-none sm:p-4",
                isDragging && "opacity-60",
            )}
        >
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
                {canManageTaskColumns ? (
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
                ) : (
                    <span className="w-7 shrink-0" aria-hidden />
                )}
                <h2 className="flex min-w-0 flex-1 items-center gap-2 text-base font-semibold sm:text-lg">
                    <span className="truncate">{column.name}</span>
                    <span className="bg-background text-muted-foreground shrink-0 rounded-full px-2 py-1 text-xs sm:text-sm">
                        {tasks.length}
                    </span>
                </h2>
                {canManageTaskColumns ? (
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
                                {!canDelete ? "Нельзя удалить (осталась одна колонка)" : "Удалить"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
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
                            canMutate={canMutateTask(role, myUserId, task)}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
