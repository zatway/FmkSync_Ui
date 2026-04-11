import {useMemo, useState} from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui_shadcn/tabs";

const PALETTE = [
    "hsl(var(--primary))",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#14b8a6",
    "#22c55e",
    "#0ea5e9",
    "#a855f7",
];

function ChartTooltip({
    active,
    payload,
    label,
    valueSuffix = "задач",
}: {
    active?: boolean;
    payload?: ReadonlyArray<{ value?: unknown; name?: unknown }>;
    label?: unknown;
    valueSuffix?: string;
}) {
    if (!active || !payload?.length) return null;
    const v = Number(payload[0]?.value ?? 0);
    const name = String(label ?? payload[0]?.name ?? "");
    return (
        <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
            <p className="font-medium text-foreground">{name}</p>
            <p className="tabular-nums text-muted-foreground">
                {v} {valueSuffix}
            </p>
        </div>
    );
}

const AnalyticsPage = () => {
    const { data: projects = [] } = useGetProjectsQuery();
    const [projectId, setProjectId] = useState<string>("");
    const queryArg = useMemo(() => (projectId ? { projectId } : undefined), [projectId]);
    const { data, isLoading, error } = useGetAnalyticsDashboardQuery(queryArg);
    const [projectIdForExport, setProjectIdForExport] = useState<string>("");
    const [chartType, setChartType] = useState<"bar" | "pie" | "area">("bar");

    const statusRows = useMemo(
        () => data?.tasksByStatus.map((s) => ({ name: s.statusName, value: s.count })) ?? [],
        [data?.tasksByStatus],
    );
    const assigneeRows = useMemo(
        () => data?.topAssignees.map((u) => ({ name: u.fullName, value: u.activeTaskCount })) ?? [],
        [data?.topAssignees],
    );

    const statusWithColors = useMemo(
        () =>
            statusRows.map((row, i) => ({
                ...row,
                fill: PALETTE[i % PALETTE.length],
            })),
        [statusRows],
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
        a.download = "prosrochennye-zadachi.csv";
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
        a.download = `zadachi-proekta-${projectIdForExport}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV сохранён");
    };

    const hasStatusData = statusRows.some((r) => r.value > 0);
    const hasAssigneeData = assigneeRows.some((r) => r.value > 0);

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
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
                    <span className="shrink-0 text-sm text-muted-foreground">Проект</span>
                    <Select value={projectId || "__all__"} onValueChange={(v) => setProjectId(v === "__all__" ? "" : v)}>
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
                    CSV — UTF-8 с русскими заголовками. Для Excel: «Данные» → «Из текста/CSV».
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
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-medium">Открытые задачи по статусам</h3>
                            </div>
                            {!hasStatusData ? (
                                <p className="text-sm text-muted-foreground">Нет данных для диаграммы</p>
                            ) : (
                                <Tabs
                                    value={chartType}
                                    onValueChange={(value) => setChartType(value as "bar" | "pie" | "area")}
                                    className="w-full flex-col"
                                >
                                    <TabsList variant="line" className="mb-4 justify-start">
                                        <TabsTrigger value="bar">Столбцы</TabsTrigger>
                                        <TabsTrigger value="pie">Круговая</TabsTrigger>
                                        <TabsTrigger value="area">По этапам (область)</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="bar" className="mt-0">
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={statusWithColors} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 11 }}
                                                        interval={0}
                                                        angle={-25}
                                                        textAnchor="end"
                                                        height={70}
                                                    />
                                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        content={<ChartTooltip />}
                                                        cursor={{ fill: "var(--muted-foreground)" }}
                                                    />
                                                    <Bar dataKey="value" name="Задач" radius={[6, 6, 0, 0]}>
                                                        {statusWithColors.map((entry, index) => (
                                                            <Cell key={`c-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="pie" className="mt-0">
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusWithColors}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={56}
                                                        outerRadius={100}
                                                        paddingAngle={2}
                                                        label={({ name, percent }) =>
                                                            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                                                        }
                                                    >
                                                        {statusWithColors.map((entry, index) => (
                                                            <Cell key={`p-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip />} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="area" className="mt-0">
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={statusWithColors} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                                                    <defs>
                                                        <linearGradient id="statusArea" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 11 }}
                                                        interval={0}
                                                        angle={-25}
                                                        textAnchor="end"
                                                        height={70}
                                                    />
                                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                                    <Tooltip content={<ChartTooltip />} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="var(--primary)"
                                                        strokeWidth={2}
                                                        fill="url(#statusArea)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>

                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="mb-4 font-medium">Загрузка исполнителей (открытые)</h3>
                            {!hasAssigneeData ? (
                                <p className="text-sm text-muted-foreground">Нет назначенных исполнителей</p>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={assigneeRows}
                                            margin={{ top: 8, right: 16, left: 8, bottom: 8}}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={120}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => (
                                                    <ChartTooltip active={active} payload={payload} label={label} />
                                                )}
                                            />
                                            <Bar dataKey="value" name="Задач" fill="hsl(215.4 16.3% 46.9%)" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <p className="mt-3 text-xs text-muted-foreground">
                                Сравнение числа открытых задач по исполнителям (топ 10).
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
