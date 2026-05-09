"use client";

import { useMemo, useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowUpDown, Edit, Trash2, FolderKanban, ArchiveRestore } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui_shadcn/table";
import { Button } from "@/shared/ui_shadcn/button";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import { Progress } from "@/shared/ui_shadcn/progress";
import { Label } from "@/shared/ui_shadcn/label";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import {
    useDeleteProjectMutation,
    useGetProjectsQuery,
    useUpdateProjectMutation,
} from "@/modules/projects/api/projectsApi";
import { ProjectBriefDto } from "@/types/dto/projects/ProjectBriefDto";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { Badge } from "@/shared/ui_shadcn/badge";
import { isMeaningfulIsoDate } from "@/shared/lib/dates/meaningfulDate";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui_shadcn/dialog";
import { PROJECT_DELETE_DETAIL_LINES } from "@/modules/projects/lib/projectDeleteConfirm";

export function ProjectsTable() {
    const [projectToDelete, setProjectToDelete] = useState<ProjectBriefDto | null>(null);
    const [hideArchived, setHideArchived] = useState(false);
    const { data: projects, isLoading } = useGetProjectsQuery({ includeArchived: true });
    const visibleProjects = useMemo(
        () => (hideArchived ? (projects ?? []).filter((p) => !p.isArchived) : projects ?? []),
        [projects, hideArchived],
    );
    const [deleteProject, { isLoading: deletingProject }] = useDeleteProjectMutation();
    const [updateProject] = useUpdateProjectMutation();
    const navigate = useNavigate();

    const columns = useMemo<ColumnDef<ProjectBriefDto>[]>(
        () => [
            {
                accessorKey: "name",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Название
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div
                            className="h-8 w-8 rounded-md flex items-center justify-center text-xl shadow-sm"
                            style={{ backgroundColor: row.original.color ? `${row.original.color}20` : "#3b82f620" }}
                        >
                            {row.original.icon || "📁"}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{row.original.name}</span>
                                {row.original.isArchived ? (
                                    <Badge variant="secondary" className="text-[10px] font-normal">
                                        Архив
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.original.key}</div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "ownerName",
                header: "Владелец",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <UserAvatar
                            size="sm"
                            userId={row.original.ownerId}
                            name={row.original.ownerName}
                            hasAvatar={row.original.ownerHasAvatar === true}
                        />
                        <span>{row.original.ownerName}</span>
                    </div>
                ),
            },
            {
                accessorKey: "memberCount",
                header: "Участники",
                cell: ({ row }) => <div>{row.original.memberCount || 0}</div>,
            },
            {
                accessorKey: "taskCount",
                header: "Задачи",
                cell: ({ row }) => (
                    <div>
                        {row.original.taskCount || 0}
                        {row.original.openTaskCount !== undefined && (
                            <span className="text-xs text-muted-foreground ml-1">
                ({row.original.openTaskCount} открытых)
              </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "progress",
                header: "Прогресс",
                cell: ({ row }) =>
                    row.original.progress !== undefined ? (
                        <div className="flex items-center gap-2">
                            <Progress value={row.original.progress} className="h-2 w-24" />
                            <span className="text-sm font-medium">{row.original.progress}%</span>
                        </div>
                    ) : (
                        "—"
                    ),
            },
            {
                accessorKey: "dueDate",
                header: "Срок",
                cell: ({ row }) =>
                    isMeaningfulIsoDate(row.original.dueDate) ? (
                        <span className="text-sm">
                            {format(parseISO(row.original.dueDate!), "d MMM yyyy", { locale: ru })}
                        </span>
                    ) : (
                        "—"
                    ),
            },
            {
                id: "actions",
                header: "Действия",
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Карточка"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`${AppRoutes.PROJECTS}/${project.id}`);
                                }}
                            >
                                <FolderKanban className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Редактировать"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`${AppRoutes.PROJECTS}/${project.id}/edit`);
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            {project.isArchived ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Вернуть из архива"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void (async () => {
                                            try {
                                                await updateProject({ id: project.id, isArchived: false }).unwrap();
                                                toast.success("Проект снова в работе");
                                            } catch (e) {
                                                toast.error(getApiErrorMessage(e));
                                            }
                                        })();
                                    }}
                                >
                                    <ArchiveRestore className="h-4 w-4" />
                                </Button>
                            ) : null}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                title="Удалить"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setProjectToDelete(project);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [navigate, updateProject]
    );

    const table = useReactTable({
        data: visibleProjects,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (isLoading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Загрузка проектов...
            </div>
        );
    }

    if (!projects?.length) {
        return (
            <div className="p-12 text-center text-muted-foreground">
                <p className="text-lg mb-4">Нет проектов</p>
                <p>Создайте первый проект, чтобы начать работу</p>
            </div>
        );
    }

    if (!visibleProjects.length) {
        return (
            <>
                <div className="mb-4 flex items-center gap-2 px-2">
                    <Checkbox
                        id="hide-archived-projects-empty"
                        checked={hideArchived}
                        onCheckedChange={(v) => setHideArchived(v === true)}
                    />
                    <Label htmlFor="hide-archived-projects-empty" className="cursor-pointer text-sm font-normal">
                        Скрыть архивные проекты
                    </Label>
                </div>
                <div className="p-12 text-center text-muted-foreground">
                    <p className="text-lg mb-2">Все проекты скрыты фильтром</p>
                    <p className="text-sm">Снимите «Скрыть архивные», чтобы снова видеть архивные карточки в таблице.</p>
                </div>
            </>
        );
    }

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            await deleteProject(projectToDelete.id).unwrap();
            toast.success("Проект удалён");
            setProjectToDelete(null);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <>
            <div className="mb-4 flex items-center gap-2 px-2">
                <Checkbox
                    id="hide-archived-projects"
                    checked={hideArchived}
                    onCheckedChange={(v) => setHideArchived(v === true)}
                />
                <Label htmlFor="hide-archived-projects" className="cursor-pointer text-sm font-normal">
                    Скрыть архивные проекты
                </Label>
            </div>
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`${AppRoutes.PROJECTS}/${row.original.id}`)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                Нет результатов
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            <Dialog open={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>
                            Удалить проект «{projectToDelete?.name ?? ""}»?
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
                                <p>Это действие нельзя отменить.</p>
                                <ul className="list-disc space-y-1 pl-5">
                                    {PROJECT_DELETE_DETAIL_LINES.map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setProjectToDelete(null)}>
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void confirmDeleteProject()}
                            disabled={deletingProject}
                        >
                            {deletingProject ? "Удаление…" : "Удалить навсегда"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
