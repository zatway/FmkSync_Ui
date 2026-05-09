"use client";

import { useMemo } from "react";
import { Button } from "@/shared/ui_shadcn/button";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import { Label } from "@/shared/ui_shadcn/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui_shadcn/popover";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import type { ProjectTagDto } from "@/types/dto/projects/ProjectTagDto";
import { ChevronsUpDown } from "lucide-react";

type Props = {
    projectTags: ProjectTagDto[];
    selectedIds: string[];
    onSelectedIdsChange: (ids: string[]) => void;
    className?: string;
};

export function TaskTagFilterPopover({ projectTags, selectedIds, onSelectedIdsChange, className }: Props) {
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const summary =
        selectedIds.length === 0
            ? "Все теги"
            : selectedIds.length === 1
              ? projectTags.find((t) => t.id === selectedIds[0])?.name ?? "1 тег"
              : `Тегов: ${selectedIds.length}`;

    const toggle = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) next.add(id);
        else next.delete(id);
        onSelectedIdsChange([...next]);
    };

    return (
        <div className={cn("grid gap-1 sm:min-w-[200px]", className)}>
            <Label className="text-xs text-muted-foreground">Теги</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="justify-between font-normal" disabled={!projectTags.length}>
                        <span className="truncate">{!projectTags.length ? "Нет тегов в проекте" : summary}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">Фильтр по тегам</span>
                        {selectedIds.length ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => onSelectedIdsChange([])}
                            >
                                Сбросить
                            </Button>
                        ) : null}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">Показать задачи, у которых есть любой из отмеченных тегов.</p>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {projectTags.map((t) => (
                            <div key={t.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`tag-f-${t.id}`}
                                    checked={selectedSet.has(t.id)}
                                    onCheckedChange={(c) => toggle(t.id, c === true)}
                                />
                                <label htmlFor={`tag-f-${t.id}`} className="text-sm font-normal leading-none">
                                    {t.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
