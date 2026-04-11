import {useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";
import {format} from "date-fns";
import {ru} from "date-fns/locale";
import {CalendarIcon, Save} from "lucide-react";

import {Button} from "@/shared/ui_shadcn/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/ui_shadcn/form";
import {Input} from "@/shared/ui_shadcn/input";
import {Textarea} from "@/shared/ui_shadcn/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui_shadcn/popover";
import {Calendar} from "@/shared/ui_shadcn/calendar";
import {cn} from "@/shared/lib/ui_shadcn/utils";
import {toast} from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import {AppRoutes} from "@/app/routes/AppRoutes";
import {useNavigate} from "react-router-dom";
import {DepartmentSelect} from "@/modules/organization";

const projectCreateSchema = z.object({
    name: z.string().min(3, "Минимум 3 символа").max(120, "Слишком длинное название"),
    departmentId: z.string().min(1, "Выберите подразделение"),
    key: z
        .string()
        .min(2, "Минимум 2 символа")
        .max(10, "Максимум 10 символов")
        .regex(/^[A-Z0-9_-]+$/, "Только заглавные буквы, цифры, _ и -"),
    description: z.string().max(2000, "Описание слишком длинное").optional(),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6})$/, "Цвет в формате #RRGGBB")
        .optional(),
    icon: z.string().max(2).optional(),
    tags: z.array(z.string()).optional(),
}).refine(
    (data) => !data.startDate || !data.dueDate || data.startDate <= data.dueDate,
    {
        message: "Дата начала не может быть позже даты завершения",
        path: ["dueDate"],
    }
);

type ProjectFormValues = z.infer<typeof projectCreateSchema>;

interface ProjectFormProps {
    submitLabel?: string;
    onSubmit: (values: ProjectFormValues) => Promise<string | undefined>;
    isLoading?: boolean;
    initialValues?: Partial<ProjectFormValues>;
}

export default function ProjectForm({
                                        submitLabel = "Создать проект",
                                        onSubmit,
                                        isLoading = false,
                                        initialValues = {},
                                    }: ProjectFormProps) {
    const navigate = useNavigate();

    const handleSubmit = async (value: ProjectFormValues) => {
        try {
            const createdId = await onSubmit(value)
            if(!createdId) throw new Error();
            toast.success("Проект успешно создан");
            navigate(`${AppRoutes.PROJECTS}/${createdId}`);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectCreateSchema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            name: "",
            departmentId: "",
            key: "",
            description: "",
            startDate: undefined,
            dueDate: undefined,
            color: "#3b82f6",
            icon: "🚀",
            tags: [],
            ...initialValues,
        },
    });

    const isSubmitDisabled = isLoading;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 p-6 md:p-8">
                {/* Основная информация */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold tracking-tight">Основная информация</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel className="text-base">Название проекта *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Например: Мобильное приложение для пациентов"
                                            className="h-11 text-base"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="key"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel className="text-base">Ключ проекта *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="PATIENT, CRM26, DIAG2026"
                                            className="h-11 uppercase text-base"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>Будет использоваться в номерах задач: PATIENT-123</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-base">Описание</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Цели проекта, целевая аудитория, ключевые особенности..."
                                        className="min-h-[140px] text-base resize-y"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold tracking-tight">Внешний вид и статус</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        <FormField
                            control={form.control}
                            name="color"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Цвет проекта</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-3 h-11">
                                            <Input
                                                type="color"
                                                className="w-12 h-10 p-1 rounded-md cursor-pointer"
                                                {...field}
                                            />
                                            <Input
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="flex-1 h-11"
                                                placeholder="#3b82f6"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="relative flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({field}) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Иконка (emoji)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="🚀 📱 💼"
                                                className="h-11 text-xl"
                                                maxLength={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-sm text-muted-foreground mt-1">
                                            Кликни в поле и нажми <kbd className="border rounded px-1.5 py-0.5 text-xs">Win
                                            + .</kbd> или <kbd>Ctrl + Cmd + Space</kbd>, чтобы открыть выбор эмодзи
                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 mt-6"
                                onClick={() => {
                                    if ("InputEvent" in window) {
                                        const input = document.querySelector('input[name="icon"]') as HTMLInputElement;
                                        if (input) input.focus();
                                        document.dispatchEvent(new KeyboardEvent("keydown", {
                                            key: ".",
                                            code: "Period",
                                            metaKey: true,
                                            bubbles: true
                                        }));
                                    }
                                }}
                            >
                                😊
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold tracking-tight">Сроки</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({field}) => (
                                <FormItem className="flex flex-col gap-1.5">
                                    <FormLabel>Дата начала</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-11",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-5 w-5"/>
                                                    {field.value ? format(field.value, "d MMMM yyyy", {locale: ru}) : "Выберите дату"}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({field}) => (
                                <FormItem className="flex flex-col gap-1.5">
                                    <FormLabel>Срок завершения</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-11",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-5 w-5"/>
                                                    {field.value ? format(field.value, "d MMMM yyyy", {locale: ru}) : "Выберите дату"}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                autoFocus
                                                disabled={(date) => form.getValues("startDate")! && date < form.getValues("startDate")!
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold tracking-tight">Подразделение</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col gap-1.5">
                                    <FormLabel>Выберите подразделение *</FormLabel>
                                    <FormControl>
                                        <DepartmentSelect
                                            selectedDepartmentId={field.value?.toString()}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Кнопка отправки */}
                <div className="pt-8 flex justify-end border-t">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitDisabled}
                        className={cn(
                            "min-w-[180px] h-12 text-base transition-all",
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-pulse">Создание...</span>
                            </>
                        ) : (
                            <>
                                {submitLabel}
                                <Save className="ml-2 h-5 w-5"/>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
