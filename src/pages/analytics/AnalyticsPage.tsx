import { useMemo, useState } from "react";
import { env } from "@/env";
import { useGetAnalyticsDashboardQuery } from "@/modules/analytics/api/analyticsApi";
import { useGetProjectsQuery } from "@/modules/projects/api/projectsApi";
import { Button } from "@/shared/ui_shadcn/button";
import { authLocalService, hasValue } from "@/shared/lib";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui_shadcn/select";

function BarChart({
    rows,
    valueKey,
    labelKey,
}: {
    rows: Array<Record<string, string | number>>;
    valueKey: string;
    labelKey: string;
}) {
    const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                Полосы сравнивают значения между собой: 100% ширины — у строки с наибольшим числом в текущей выборке (
                {max}).
            </p>
            {rows.map((row, i) => {
                const v = Number(row[valueKey]) || 0;
                const pct = Math.round((v / max) * 100);
                return (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between gap-2 text-sm">
                            <span className="truncate text-foreground">{String(row[labelKey])}</span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">{v}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary/80 transition-[width]"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const AnalyticsPage = () => {
    const { data: projects = [] } = useGetProjectsQuery();
    const [projectId, setProjectId] = useState<string>("");
    const queryArg = useMemo(
        () => (projectId ? { projectId } : undefined),
        [projectId],
    );
    const { data, isLoading, error } = useGetAnalyticsDashboardQuery(queryArg);
    const [projectIdForExport, setProjectIdForExport] = useState<string>("");

    const statusRows = useMemo(
        () => data?.tasksByStatus.map((s) => ({ label: s.statusName, value: s.count })) ?? [],
        [data?.tasksByStatus],
    );
    const assigneeRows = useMemo(
        () => data?.topAssignees.map((u) => ({ label: u.fullName, value: u.activeTaskCount })) ?? [],
        [data?.topAssignees],
    );

    const exportOverdue = async () => {
        const bearer = authLocalService.getToken();
        if (!hasValue(bearer)) {
            toast.error("Нет авторизации");
            return;
        }
        const res = await fetch(`${env.VITE_API_BASE_URL}/reports/tasks/overdue.csv`, {
            headers: { Authorization: `Bearer ${bearer}` },
        });
        if (!res.ok) {
            toast.error("Не удалось скачать отчёт");
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "overdue-tasks.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Файл сохранён");
    };

    const exportProjectTasks = async () => {
        if (!projectIdForExport) {
            toast.error("Выберите проект");
            return;
        }
        const bearer = authLocalService.getToken();
        if (!hasValue(bearer)) {
            toast.error("Нет авторизации");
            return;
        }
        const res = await fetch(`${env.VITE_API_BASE_URL}/reports/projects/${projectIdForExport}/tasks.csv`, {
            headers: { Authorization: `Bearer ${bearer}` },
        });
        if (!res.ok) {
            toast.error("Не удалось скачать отчёт");
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tasks-${projectIdForExport}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV сохранён");
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Аналитика и отчёты</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Сводка по открытым задачам (не завершённым). Выберите проект или смотрите все доступные.
                    </p>
                </div>
            </div>

            <section className="rounded-xl border bg-card p-4 md:p-6">
                <h2 className="mb-3 text-lg font-medium">Область аналитики</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:max-w-md">
                    <span className="text-sm text-muted-foreground shrink-0">Проект</span>
                    <Select
                        value={projectId || "__all__"}
                        onValueChange={(v) => setProjectId(v === "__all__" ? "" : v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Все доступные проекты" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Все доступные проекты</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-4 md:p-6">
                <h2 className="mb-4 text-lg font-medium">Выгрузки</h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-muted-foreground">Просроченные задачи</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => void exportOverdue()}>
                            Скачать CSV
                        </Button>
                    </div>
                    <div className="flex min-w-[min(100%,280px)] flex-col gap-2 sm:max-w-sm">
                        <span className="text-sm text-muted-foreground">Все задачи выбранного проекта</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={projectIdForExport} onValueChange={setProjectIdForExport}>
                                <SelectTrigger className="w-full sm:w-[240px]">
                                    <SelectValue placeholder="Проект…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => void exportProjectTasks()}
                                disabled={!projectIdForExport}
                            >
                                CSV задач проекта
                            </Button>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    CSV — UTF-8. Для Excel: «Данные» → «Из текста/CSV».
                </p>
            </section>

            {isLoading && <p className="text-muted-foreground">Загрузка дашборда…</p>}
            {error && <p className="text-destructive">Не удалось загрузить данные</p>}
            {data && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border bg-card p-5">
                            <div className="text-sm text-muted-foreground">Открытых задач</div>
                            <div className="mt-1 text-3xl font-semibold tabular-nums">{data.openTasks}</div>
                        </div>
                        <div className="rounded-xl border bg-card p-5">
                            <div className="text-sm text-muted-foreground">Просрочено среди открытых</div>
                            <div className="mt-1 text-3xl font-semibold tabular-nums text-destructive">
                                {data.overdueTasks}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="mb-4 font-medium">Открытые задачи по статусам</h3>
                            <BarChart rows={statusRows} labelKey="label" valueKey="value" />
                        </div>
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="mb-4 font-medium">Загрузка исполнителей (открытые)</h3>
                            <BarChart rows={assigneeRows} labelKey="label" valueKey="value" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
