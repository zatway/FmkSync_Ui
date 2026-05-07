import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGetProjectByIdQuery } from "@/modules/projects/api/projectsApi";
import { useGetTasksByProjectQuery } from "@/modules/tasks/api/tasksApi";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { Button } from "@/shared/ui_shadcn/button";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui_shadcn/table";
import { Badge } from "@/shared/ui_shadcn/badge";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Label } from "@/shared/ui_shadcn/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui_shadcn/select";
import { authLocalService } from "@/shared/lib";
import { canCreateTasks as roleCanCreateTasks } from "@/modules/tasks/lib/taskAccess";
import { UserAvatar } from "@/shared/ui/UserAvatar";

export default function ProjectTasksTablePage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { data: project } = useGetProjectByIdQuery(projectId!, { skip: !projectId });
    const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId!, { skip: !projectId });
    const role = authLocalService.getUserRole();
    const canCreate =
        project?.permissions?.canCreateTasks ?? roleCanCreateTasks(role);

    const [filterAssigneeId, setFilterAssigneeId] = useState<string>("__all__");
    const [filterResponsibleId, setFilterResponsibleId] = useState<string>("__all__");

    const assigneeFilterOptions = useMemo(() => {
        const m = new Map<string, string>();
        for (const t of tasks) {
            if (t.assignee?.id) m.set(t.assignee.id, t.assignee.name);
        }
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
    }, [tasks]);

    const responsibleFilterOptions = useMemo(() => {
        const m = new Map<string, string>();
        for (const t of tasks) {
            if (t.responsible?.id) m.set(t.responsible.id, t.responsible.name);
        }
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (filterAssigneeId === "__none__") {
                if (t.assignee != null) return false;
            } else if (filterAssigneeId !== "__all__" && t.assignee?.id !== filterAssigneeId) return false;
            if (filterResponsibleId === "__none__") {
                if (t.responsible != null) return false;
            } else if (filterResponsibleId !== "__all__" && t.responsible?.id !== filterResponsibleId) return false;
            return true;
        });
    }, [tasks, filterAssigneeId, filterResponsibleId]);

    const goTask = (id: string) => {
        navigate(`${AppRoutes.TASKS}/${projectId}/detail/${id}`);
    };

    return (
        <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4 max-w-full">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div className="min-w-0">
                    <Button
                        variant="ghost"
                        className="px-2 sm:px-4"
                        onClick={() => navigate(`${AppRoutes.PROJECTS}/${projectId}`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                        К проекту
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-bold mt-2 truncate">
                        Задачи: {project?.name ?? projectId}
                    </h1>
                </div>
                {canCreate ? (
                    <Button
                        className="shrink-0 w-full sm:w-auto"
                        onClick={() => navigate(`${AppRoutes.TASKS}/${projectId}/create`)}
                    >
                        Новая задача
                    </Button>
                ) : null}
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-end">
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

            {isLoading && <p className="text-muted-foreground">Загрузка…</p>}
            <div className="border rounded-xl overflow-x-auto bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Ключ</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead className="hidden sm:table-cell whitespace-nowrap">Статус</TableHead>
                            <TableHead className="hidden md:table-cell whitespace-nowrap">Приоритет</TableHead>
                            <TableHead className="hidden lg:table-cell whitespace-nowrap">Исполнитель</TableHead>
                            <TableHead className="hidden lg:table-cell whitespace-nowrap">Ответственный</TableHead>
                            <TableHead className="hidden md:table-cell whitespace-nowrap">Срок</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTasks.map((t) => (
                            <TableRow
                                key={t.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onDoubleClick={() => goTask(t.id)}
                            >
                                <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{t.key}</TableCell>
                                <TableCell className="max-w-[min(60vw,280px)] sm:max-w-none">
                                    <Link
                                        to={`${AppRoutes.TASKS}/${projectId}/detail/${t.id}`}
                                        className="hover:underline font-medium line-clamp-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t.title}
                                    </Link>
                                    <div className="sm:hidden mt-1 flex flex-wrap gap-1">
                                        <Badge variant="secondary" className="text-[10px]">
                                            {t.status.name}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">{t.priority}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Badge variant="secondary">{t.status.name}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{t.priority}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    {t.assignee ? (
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                size="s"
                                                userId={t.assignee.id}
                                                name={t.assignee.name}
                                                hasAvatar={t.assignee.hasAvatar ?? false}
                                            />
                                            <span className="truncate">{t.assignee.name}</span>
                                        </div>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    {t.responsible ? (
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                size="s"
                                                userId={t.responsible.id}
                                                name={t.responsible.name}
                                                hasAvatar={t.responsible.hasAvatar ?? false}
                                            />
                                            <span className="truncate">{t.responsible.name}</span>
                                        </div>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell whitespace-nowrap">
                                    {t.deadline ? format(parseISO(t.deadline), "d MMM yyyy", { locale: ru }) : "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!filteredTasks.length && !isLoading && (
                    <p className="p-6 text-center text-muted-foreground">
                        {tasks.length ? "Нет задач по выбранным фильтрам" : "Задач пока нет"}
                    </p>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-3 hidden sm:block">
                Двойной щелчок по строке открывает задачу
            </p>
        </div>
    );
}
