"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Edit, Reply, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { Textarea } from "@/shared/ui_shadcn/textarea";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import { CommentAttachmentLink } from "@/shared/ui/CommentAttachmentLink";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import type { TaskCommentDto } from "@/types/dto/taskComments/TaskCommentDto";

type Props = {
    comment: TaskCommentDto;
    level: number;
    /** Автор комментария или админ/менеджер могут удалять вложения к комментарию. */
    canModerateAttachments: boolean;
    /** Режим только просмотра: скрыть ответ, правку и удаление. */
    readOnly?: boolean;
    currentUserId: string | null;
    editingId: string | null;
    editContent: string;
    deletingComment: boolean;
    updatingComment: boolean;
    onReply: (comment: TaskCommentDto) => void;
    onStartEdit: (id: string, content: string) => void;
    onSaveEdit: () => void;
    onEditContentChange: (value: string) => void;
    onRemove: (id: string) => void;
};

export function TaskCommentItem({
    comment,
    level,
    canModerateAttachments,
    readOnly = false,
    currentUserId,
    editingId,
    editContent,
    deletingComment,
    updatingComment,
    onReply,
    onStartEdit,
    onSaveEdit,
    onEditContentChange,
    onRemove,
}: Props) {
    const isMine = currentUserId === comment.userId;
    const showDeleteAttachment = canModerateAttachments || isMine;

    return (
        <div className={cn("flex gap-4", level > 0 && "ml-10 border-l-2 border-muted pl-6")}>
            <UserAvatar
                userId={comment.userId}
                name={comment.authorName}
                hasAvatar={comment.authorHasAvatar === true}
                className="mt-1 shrink-0"
            />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                        {format(parseISO(comment.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                            <span className="ml-1 italic">(изменено)</span>
                        )}
                    </span>
                </div>
                {editingId === comment.id ? (
                    <Textarea value={editContent} onChange={(e) => onEditContentChange(e.target.value)} rows={3} className="mt-2" />
                ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                )}
                {comment.attachments?.length ? (
                    <div className="mt-3 flex flex-col gap-1">
                        {comment.attachments.map((a) => (
                            <CommentAttachmentLink key={a.id} attachment={a} showDelete={showDeleteAttachment} />
                        ))}
                    </div>
                ) : null}
                {!readOnly ? (
                <div className="flex flex-wrap items-center gap-4 mt-3">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" type="button" onClick={() => onReply(comment)}>
                        <Reply className="mr-1 h-3.5 w-3.5" />
                        Ответить
                    </Button>
                    {isMine && (
                        <>
                            {editingId === comment.id ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 px-2 text-xs"
                                    disabled={updatingComment}
                                    onClick={() => void onSaveEdit()}
                                >
                                    Сохранить
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => onStartEdit(comment.id, comment.content)}
                                >
                                    <Edit className="mr-1 h-3.5 w-3.5" />
                                    Правка
                                </Button>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-destructive"
                                disabled={deletingComment}
                                onClick={() => void onRemove(comment.id)}
                            >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Удалить
                            </Button>
                        </>
                    )}
                </div>
                ) : null}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-6 space-y-6">
                        {comment.replies.map((reply) => (
                            <TaskCommentItem
                                key={reply.id}
                                comment={reply}
                                level={level + 1}
                                canModerateAttachments={canModerateAttachments}
                                readOnly={readOnly}
                                currentUserId={currentUserId}
                                editingId={editingId}
                                editContent={editContent}
                                deletingComment={deletingComment}
                                updatingComment={updatingComment}
                                onReply={onReply}
                                onStartEdit={onStartEdit}
                                onSaveEdit={onSaveEdit}
                                onEditContentChange={onEditContentChange}
                                onRemove={onRemove}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
