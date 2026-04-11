import { useCallback, useEffect, useMemo, useState } from "react";
import { generatePath, Link } from "react-router-dom";
import { Input } from "@/shared/ui_shadcn/input";
import { useLazyGlobalSearchQuery, type SearchHit } from "@/modules/search/api/searchApi";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { env } from "@/env";
import { cn } from "@/shared/lib/ui_shadcn/utils";

const kindLabel: Record<string, string> = {
    project: "Проект",
    task: "Задача",
    knowledge: "Статья",
    taskComment: "Комментарий",
    projectComment: "Комментарий",
};

function hitLink(hit: SearchHit) {
    if (hit.kind === "project") return `${AppRoutes.PROJECTS}/${hit.id}`;
    if (hit.kind === "task" && hit.projectId) return `${AppRoutes.TASKS}/${hit.projectId}/detail/${hit.id}`;
    if (hit.kind === "knowledge" && hit.subtitle)
        return generatePath(env.ROUTE_KNOWLEDGE_ARTICLE, { slug: hit.subtitle });
    if (hit.kind === "taskComment" && hit.projectId) return `${AppRoutes.TASKS}/${hit.projectId}`;
    if (hit.kind === "projectComment" && hit.projectId) return `${AppRoutes.PROJECTS}/${hit.projectId}`;
    return null;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

type Scope = "knowledge" | "tasks";

function filterHits(hits: SearchHit[] | undefined, scope: Scope): SearchHit[] {
    if (!hits?.length) return [];
    if (scope === "knowledge") return hits.filter((h) => h.kind === "knowledge");
    return hits.filter((h) => h.kind === "task" || h.kind === "taskComment");
}

export function HeaderQuickSearches() {
    const [qKb, setQKb] = useState("");
    const [qTasks, setQTasks] = useState("");
    const debouncedKb = useDebouncedValue(qKb.trim(), 280);
    const debouncedTasks = useDebouncedValue(qTasks.trim(), 280);
    const [search] = useLazyGlobalSearchQuery();
    const [kbHits, setKbHits] = useState<SearchHit[] | undefined>(undefined);
    const [taskHits, setTaskHits] = useState<SearchHit[] | undefined>(undefined);
    const [kbLoading, setKbLoading] = useState(false);
    const [tasksLoading, setTasksLoading] = useState(false);

    const runKb = useCallback(async () => {
        if (debouncedKb.length < 2) {
            setKbHits(undefined);
            return;
        }
        setKbLoading(true);
        try {
            const data = await search({ q: debouncedKb, take: 40 }).unwrap();
            setKbHits(filterHits(data, "knowledge"));
        } catch {
            setKbHits([]);
        } finally {
            setKbLoading(false);
        }
    }, [debouncedKb, search]);

    const runTasks = useCallback(async () => {
        if (debouncedTasks.length < 2) {
            setTaskHits(undefined);
            return;
        }
        setTasksLoading(true);
        try {
            const data = await search({ q: debouncedTasks, take: 40 }).unwrap();
            setTaskHits(filterHits(data, "tasks"));
        } catch {
            setTaskHits([]);
        } finally {
            setTasksLoading(false);
        }
    }, [debouncedTasks, search]);

    useEffect(() => {
        void runKb();
    }, [runKb]);

    useEffect(() => {
        void runTasks();
    }, [runTasks]);

    const kbList = useMemo(() => kbHits ?? [], [kbHits]);
    const taskList = useMemo(() => taskHits ?? [], [taskHits]);

    return (
        <div className="hidden lg:flex flex-1 min-w-0 max-w-2xl mx-4 gap-3 items-start">
            <div className="flex-1 min-w-0 relative">
                <Input
                    value={qKb}
                    onChange={(e) => setQKb(e.target.value)}
                    placeholder="База знаний…"
                    className="h-9 text-sm"
                    aria-label="Поиск по базе знаний"
                />
                {debouncedKb.length >= 2 && (
                    <div
                        className={cn(
                            "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-y-auto text-sm",
                            !kbList.length && !kbLoading && "p-2 text-muted-foreground"
                        )}
                    >
                        {kbLoading && debouncedKb.length >= 2 && (
                            <div className="p-2">Поиск…</div>
                        )}
                        {!kbLoading && !kbList.length && <div className="p-2">Ничего не найдено</div>}
                        {kbList.map((hit) => {
                            const to = hitLink(hit);
                            return (
                                <div key={`kb-${hit.kind}-${hit.id}`} className="border-b last:border-0">
                                    {to ? (
                                        <Link
                                            to={to}
                                            onClick={() => setQKb("")}
                                            className="block px-3 py-2 hover:bg-accent truncate"
                                            title={hit.title}
                                        >
                                            <span className="text-xs text-muted-foreground">{kindLabel[hit.kind]}</span>
                                            <div className="font-medium truncate">{hit.title}</div>
                                        </Link>
                                    ) : (
                                        <div className="px-3 py-2">
                                            <span className="text-xs text-muted-foreground">{kindLabel[hit.kind]}</span>
                                            <div className="font-medium truncate">{hit.title}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 relative">
                <Input
                    value={qTasks}
                    onChange={(e) => setQTasks(e.target.value)}
                    placeholder="Задачи…"
                    className="h-9 text-sm"
                    aria-label="Поиск по задачам"
                />
                {debouncedTasks.length >= 2 && (
                    <div
                        className={cn(
                            "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-y-auto text-sm",
                            !taskList.length && !tasksLoading && "p-2 text-muted-foreground"
                        )}
                    >
                        {tasksLoading && debouncedTasks.length >= 2 && (
                            <div className="p-2">Поиск…</div>
                        )}
                        {!tasksLoading && !taskList.length && <div className="p-2">Ничего не найдено</div>}
                        {taskList.map((hit) => {
                            const to = hitLink(hit);
                            return (
                                <div key={`t-${hit.kind}-${hit.id}`} className="border-b last:border-0">
                                    {to ? (
                                        <Link
                                            to={to}
                                            onClick={() => setQTasks("")}
                                            className="block px-3 py-2 hover:bg-accent truncate"
                                            title={hit.title}
                                        >
                                            <span className="text-xs text-muted-foreground">{kindLabel[hit.kind]}</span>
                                            <div className="font-medium truncate">{hit.title}</div>
                                            {hit.subtitle && (
                                                <div className="text-xs text-muted-foreground truncate">{hit.subtitle}</div>
                                            )}
                                        </Link>
                                    ) : (
                                        <div className="px-3 py-2">
                                            <span className="text-xs text-muted-foreground">{kindLabel[hit.kind]}</span>
                                            <div className="font-medium truncate">{hit.title}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
