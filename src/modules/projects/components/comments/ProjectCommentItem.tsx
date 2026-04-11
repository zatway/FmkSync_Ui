"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Trash2, Reply, Edit } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import { Button } from "@/shared/ui_shadcn/button";
import { ProjectCommentForm } from "@/modules/projects";
import { ProjectCommentDto } from "@/types/dto/projectComments/ProjectCommentDto";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { useDeleteProjectCommentMutation } from "@/modules/projects/api/projectsApi";
import { getApiErrorMessage } from "@/shared/lib";
import { toAbsoluteApiUrl } from "@/shared/lib/absoluteApiUrl";

interface Props {
    comment: ProjectCommentDto;
    projectId: string;
    level: number;
}

export function ProjectCommentItem({ comment, projectId, level }: Props) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteComment, { isLoading: deleting }] = useDeleteProjectCommentMutation();

    const handleDelete = async () => {
        if (!confirm("Удалить комментарий и ответы к нему?")) return;
        try {
            await deleteComment({ commentId: comment.id, projectId }).unwrap();
            toast.success("Комментарий удалён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className={cn("flex gap-4", level > 0 && "ml-10 border-l-2 border-muted pl-6")}>
            <UserAvatar userId={comment.author.id} name={comment.author.name} className="mt-1" />

            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
            {format(parseISO(comment.createdAt), "d MMM yyyy, HH:mm", {locale: ru})}
                        {comment.updatedAt && <span className="ml-1 italic">(изменено)</span>}
          </span>
                </div>

                {isEditing ? (
                    <ProjectCommentForm
                        projectId={projectId}
                        parentId={comment.parentId}
                        onSuccess={() => setIsEditing(false)}
                        initialValues={comment.content}
                    />
                ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                    </p>
                )}

                {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1">
                        {comment.attachments.map((a) => (
                            <a
                                key={a.id}
                                href={toAbsoluteApiUrl(a.downloadUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline underline-offset-2 w-fit"
                            >
                                {a.fileName}
                            </a>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        <Reply className="mr-1 h-3.5 w-3.5"/>
                        Ответить
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        <Edit className="mr-1 h-3.5 w-3.5"/>
                        Редактировать
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                    >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Удалить
                    </Button>
                </div>

                {isReplying && (
                    <div className="mt-4">
                        <ProjectCommentForm
                            projectId={projectId}
                            parentId={comment.id}
                            onSuccess={() => setIsReplying(false)}
                        />
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-6 space-y-6">
                        {comment.replies.map((reply) => (
                            <ProjectCommentItem
                                key={reply.id}
                                comment={reply}
                                projectId={projectId}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
