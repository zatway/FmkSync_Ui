"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { Textarea } from "@/shared/ui_shadcn/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/ui_shadcn/form";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { FilePickerButton } from "@/shared/ui/FilePickerButton";
import { useAddProjectCommentMutation } from "@/modules/projects/api/projectsApi";
import { useGetProjectByIdQuery, useUploadProjectCommentAttachmentsMutation } from "@/modules/projects/api/projectsApi";

const commentSchema = z.object({
    content: z.string().min(1, "Комментарий не может быть пустым").max(2000),
});

type FormValues = z.infer<typeof commentSchema>;

interface Props {
    projectId: string;
    parentId?: string;      // если это ответ на комментарий
    onSuccess?: () => void; // закрыть форму ответа и т.д.
    initialValues?: string;
}

export function ProjectCommentForm({projectId, parentId, onSuccess, initialValues}: Props) {
    const [createComment, {isLoading}] = useAddProjectCommentMutation();
    const [uploadAttachments, { isLoading: uploading }] = useUploadProjectCommentAttachmentsMutation();
    const { data: project } = useGetProjectByIdQuery(projectId, { skip: !projectId });
    const [files, setFiles] = useState<File[]>([]);
    const [mentionIds, setMentionIds] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: initialValues ?? "" },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    useEffect(() => {
        if (initialValues !== undefined) {
            form.reset({ content: initialValues });
        }
    }, [initialValues, form]);

    const onSubmit = async (values: FormValues) => {
        try {

            const res = await createComment({
                projectId: projectId,
                data: {
                    content: values.content,
                    parentId,
                    projectId: projectId,
                    mentionsUserIds: mentionIds.length ? mentionIds : null,
                }
            }).unwrap();

            // res can be {id, createdAt}
            const createdId = res?.id;
            if (createdId && files.length) {
                await uploadAttachments({ commentId: createdId, projectId, files }).unwrap();
            }

            form.reset();
            setFiles([]);
            setMentionIds([]);
            toast.success(parentId ? "Ответ добавлен" : "Комментарий добавлен");
            onSuccess?.();
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {project?.members?.length ? (
                    <div className="flex flex-wrap gap-2">
                        {project.members.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                className="text-xs px-2 py-1 rounded-md border hover:bg-accent"
                                onClick={() => {
                                    if (!mentionIds.includes(m.id)) setMentionIds([...mentionIds, m.id])
                                    form.setValue("content", `${form.getValues("content") ?? ""} @${m.name}`.trim(), { shouldValidate: true })
                                }}
                            >
                                @{m.name}
                            </button>
                        ))}
                    </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                    <FilePickerButton
                        multiple
                        disabled={isLoading || uploading}
                        onFiles={setFiles}
                        label="Прикрепить файлы"
                    />
                    {files.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {files.map((f) => f.name).join(", ")}
                        </span>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder={parentId ? "Напишите ответ..." : "Напишите комментарий к проекту..."}
                                    className="min-h-[100px] resize-y text-base"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading || uploading}>
                        <Send className="mr-2 h-4 w-4"/>
                        {isLoading ? "Отправка..." : parentId ? "Ответить" : "Отправить"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
