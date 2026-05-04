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
import { ArrowUpDown, Edit, Trash2, FolderKanban } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui_shadcn/table";
import { Button } from "@/shared/ui_shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui_shadcn/avatar";
import { Progress } from "@/shared/ui_shadcn/progress";
import { Label } from "@/shared/ui_shadcn/label";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import {useDeleteProjectMutation, useGetProjectsQuery} from "@/modules/projects/api/projectsApi";
import { ProjectBriefDto } from "@/types/dto/projects/ProjectBriefDto";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";

export function ProjectsTable() {
    const [showArchived, setShowArchived] = useState(false);
    const { data: projects, isLoading } = useGetProjectsQuery(
        showArchived ? { includeArchived: true } : undefined,
    );
    const [deleteProject] = useDeleteProjectMutation();
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
                        <div>
                            <div className="font-medium">{row.original.name}</div>
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
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={row.original.ownerAvatarUrl} alt={row.original.ownerName} />
                            <AvatarFallback>{row.original.ownerName?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
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
                    row.original.dueDate ? (
                        <span className="text-sm">
              {format(parseISO(row.original.dueDate), "d MMM yyyy", { locale: ru })}
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
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`${AppRoutes.PROJECTS}/${project.id}/edit`)
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    deleteProject(project.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [navigate, deleteProject]
    );

    const table = useReactTable({
        data: projects ?? [],
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

    return (
        <>
            <div className="mb-4 flex items-center gap-2 px-2">
                <Checkbox
                    id="show-archived-projects"
                    checked={showArchived}
                    onCheckedChange={(v) => setShowArchived(v === true)}
                />
                <Label htmlFor="show-archived-projects" className="text-sm font-normal cursor-pointer">
                    Показать архивные проекты
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
        </>
    );
}
