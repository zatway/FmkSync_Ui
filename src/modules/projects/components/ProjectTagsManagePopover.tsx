"use client";

import { useState } from "react";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { Label } from "@/shared/ui_shadcn/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui_shadcn/popover";
import { Badge } from "@/shared/ui_shadcn/badge";
import {
    useCreateProjectTagMutation,
    useDeleteProjectTagMutation,
} from "@/modules/projects/api/projectsApi";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import type { ProjectTagDto } from "@/types/dto/projects/ProjectTagDto";
import { Settings2, X } from "lucide-react";

type Props = {
    projectId: string;
    tags: ProjectTagDto[];
};

export function ProjectTagsManagePopover({ projectId, tags }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [createTag, { isLoading: creating }] = useCreateProjectTagMutation();
    const [deleteTag, { isLoading: deleting }] = useDeleteProjectTagMutation();

    const handleCreate = async () => {
        const n = name.trim();
        if (!n) {
            toast.error("Введите название тега");
            return;
        }
        try {
            await createTag({ projectId, name: n }).unwrap();
            setName("");
            toast.success("Тег добавлен");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleDelete = async (tagId: string) => {
        try {
            await deleteTag({ projectId, tagId }).unwrap();
            toast.success("Тег удалён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="grid gap-1 sm:min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Теги проекта</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="secondary" className="justify-start gap-2 font-normal">
                        <Settings2 className="h-4 w-4 shrink-0" />
                        Управление
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                    <p className="mb-2 text-sm font-medium">Создание и удаление тегов</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Теги привязываются к задачам при создании или редактировании задачи.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Название"
                            maxLength={80}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleCreate();
                                }
                            }}
                        />
                        <Button type="button" size="sm" onClick={() => void handleCreate()} disabled={creating}>
                            Добавить
                        </Button>
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                        {!tags.length ? (
                            <p className="text-xs text-muted-foreground">Пока нет тегов</p>
                        ) : (
                            tags.map((t) => (
                                <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                                    <Badge variant="secondary" className="max-w-[180px] truncate font-normal">
                                        {t.name}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        disabled={deleting}
                                        aria-label={`Удалить тег ${t.name}`}
                                        onClick={() => void handleDelete(t.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
