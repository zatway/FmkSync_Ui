"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui_shadcn/popover";
import { Calendar } from "@/shared/ui_shadcn/calendar";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/ui_shadcn/form";
import { Input } from "@/shared/ui_shadcn/input";
import { Textarea } from "@/shared/ui_shadcn/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui_shadcn/select";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import { ProjectTaskPriority } from "@/types/dto/enums/ProjectTaskPriority";
import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";
import type { ProjectTagDto } from "@/types/dto/projects/ProjectTagDto";

export const TASK_PRIORITY_LABELS: Record<ProjectTaskPriority, string> = {
    [ProjectTaskPriority.Low]: "Низкий",
    [ProjectTaskPriority.Medium]: "Средний",
    [ProjectTaskPriority.High]: "Высокий",
    [ProjectTaskPriority.Critical]: "Критический",
};

const schema = z.object({
    title: z.string().min(1, "Укажите название").max(500),
    description: z.string().max(4000).optional().or(z.literal("")),
    projectTaskStatusColumnId: z.string().uuid("Выберите колонку статуса"),
    priority: z.nativeEnum(ProjectTaskPriority),
    assigneeId: z.string().optional().nullable(),
    responsibleId: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    watcherIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

interface MemberOption {
    id: string;
    name: string;
}

interface TaskFormProps {
    statusColumns: TaskStatusColumnDto[];
    defaultValues?: Partial<TaskFormValues>;
    members: MemberOption[];
    /** Теги проекта (выбор нескольких на задаче) */
    projectTags?: ProjectTagDto[];
    submitLabel: string;
    onSubmit: (values: TaskFormValues) => Promise<void>;
    isLoading?: boolean;
}

export function TaskForm({
    statusColumns,
    defaultValues,
    members,
    projectTags = [],
    submitLabel,
    onSubmit,
    isLoading,
}: TaskFormProps) {
    const sortedColumns = [...statusColumns].sort((a, b) => a.sortOrder - b.sortOrder);
    const firstColumnId = sortedColumns[0]?.id;

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            title: "",
            description: "",
            projectTaskStatusColumnId: firstColumnId ?? "",
            priority: ProjectTaskPriority.Medium,
            assigneeId: null,
            responsibleId: null,
            deadline: "",
            watcherIds: [],
            tagIds: [],
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Название</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                                <Textarea rows={5} {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="projectTaskStatusColumnId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Статус (колонка)</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!sortedColumns.length}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите колонку" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sortedColumns.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Приоритет</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(ProjectTaskPriority).map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {TASK_PRIORITY_LABELS[p]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => {
                        const parsed = field.value
                            ? parse(field.value, "yyyy-MM-dd", new Date())
                            : undefined;
                        const dateVal = parsed && isValid(parsed) ? parsed : undefined;
                        return (
                            <FormItem className="flex flex-col">
                                <FormLabel>Срок (дата)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateVal
                                                    ? format(dateVal, "d MMMM yyyy", { locale: ru })
                                                    : "Выберите дату"}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            locale={ru}
                                            selected={dateVal}
                                            onSelect={(d) =>
                                                field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                                            }
                                        />
                                        {field.value ? (
                                            <div className="border-t p-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => field.onChange("")}
                                                >
                                                    Сбросить срок
                                                </Button>
                                            </div>
                                        ) : null}
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Исполнитель</FormLabel>
                            <Select
                                onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                                value={field.value ?? "__none__"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Не назначен" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Не назначен</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="responsibleId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ответственный</FormLabel>
                            <Select
                                onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                                value={field.value ?? "__none__"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Не назначен" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Не назначен</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {projectTags.length > 0 ? (
                    <FormField
                        control={form.control}
                        name="tagIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Теги</FormLabel>
                                <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                                    {projectTags.map((t) => (
                                        <div key={t.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`tag-${t.id}`}
                                                checked={field.value?.includes(t.id)}
                                                onCheckedChange={(checked) => {
                                                    const next = new Set(field.value ?? []);
                                                    if (checked) next.add(t.id);
                                                    else next.delete(t.id);
                                                    field.onChange([...next]);
                                                }}
                                            />
                                            <label htmlFor={`tag-${t.id}`} className="text-sm font-normal">
                                                {t.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : null}

                <FormField
                    control={form.control}
                    name="watcherIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Наблюдатели</FormLabel>
                            <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                                {members.map((m) => (
                                    <div key={m.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`w-${m.id}`}
                                            checked={field.value?.includes(m.id)}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(field.value ?? []);
                                                if (checked) next.add(m.id);
                                                else next.delete(m.id);
                                                field.onChange([...next]);
                                            }}
                                        />
                                        <label htmlFor={`w-${m.id}`} className="text-sm font-normal">
                                            {m.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isLoading || !sortedColumns.length}
                >
                    {submitLabel}
                </Button>
            </form>
        </Form>
    );
}
