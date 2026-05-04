import { useParams, useNavigate, Link } from "react-router-dom";
import {
    useGetTaskByIdQuery,
    useDeleteTaskMutation,
    useAddTaskCommentMutation,
    useUploadTaskCommentAttachmentsMutation,
    useUpdateTaskCommentMutation,
    useDeleteTaskCommentMutation,
    useChangeTaskStatusMutation,
} from "@/modules/tasks/api/tasksApi";
import { useGetProjectByIdQuery, useGetProjectTaskStatusColumnsQuery } from "@/modules/projects/api/projectsApi";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { Button } from "@/shared/ui_shadcn/button";
import { ArrowLeft, BookOpen, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui_shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Textarea } from "@/shared/ui_shadcn/textarea";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { parseAccessTokenClaims } from "@/shared/lib/auth/tokenClaims";
import { authLocalService, getApiErrorMessage } from "@/shared/lib";
import { FilePickerButton } from "@/shared/ui/FilePickerButton";
import TaskHistory from "@/modules/tasks/components/TaskHistory";
import { TaskCommentItem } from "@/modules/tasks/components/TaskCommentItem";
import type { TaskStatusColumnDto } from "@/types/dto/tasks/TaskStatusColumnDto";
import { resolveDoneColumnId } from "@/modules/tasks/lib/resolveDoneColumnId";

export function TaskDetailView() {
    const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
    const navigate = useNavigate();
    const { data: task, isLoading } = useGetTaskByIdQuery(taskId!, { skip: !taskId });
    const { data: project } = useGetProjectByIdQuery(projectId!, { skip: !projectId });
    const emptyStatusColumns = useRef<TaskStatusColumnDto[]>([]).current;
    const { data: statusColumnsData } = useGetProjectTaskStatusColumnsQuery(projectId!, { skip: !projectId });
    const statusColumns = statusColumnsData ?? emptyStatusColumns;
    const [remove, { isLoading: deleting }] = useDeleteTaskMutation();
    const [changeStatus, { isLoading: closing }] = useChangeTaskStatusMutation();
    const [addComment, { isLoading: addingComment }] = useAddTaskCommentMutation();
    const [uploadAttachments, { isLoading: uploading }] = useUploadTaskCommentAttachmentsMutation();
    const [updateComment, { isLoading: updatingComment }] = useUpdateTaskCommentMutation();
    const [deleteCommentMut, { isLoading: deletingComment }] = useDeleteTaskCommentMutation();
    const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState<{ userId: string; authorName: string } | null>(null);
    const [replyParentCommentId, setReplyParentCommentId] = useState<string | null>(null);
    const [mentionIds, setMentionIds] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    const currentUserId = useMemo(() => {
        const t = authLocalService.getToken();
        if (!t) return null;
        return parseAccessTokenClaims(t)?.userId ?? null;
    }, []);

    const doneColumnId = useMemo(() => resolveDoneColumnId(statusColumns), [statusColumns]);

    const mentionMembers = useMemo(() => {
        if (!project) return [];
        const seen = new Set<string>();
        const out: { id: string; name: string }[] = [];
        if (project.owner) {
            out.push({ id: project.owner.id, name: project.owner.name });
            seen.add(project.owner.id);
        }
        for (const m of project.members ?? []) {
            if (!seen.has(m.id)) {
                out.push({ id: m.id, name: m.name });
                seen.add(m.id);
            }
        }
        return out;
    }, [project]);

    const handleCloseTask = async () => {
        if (!taskId || !projectId || !task || !doneColumnId || task.status.isDoneColumn) return;
        try {
            await changeStatus({
                taskId,
                projectId,
                newStatusColumnId: doneColumnId,
            }).unwrap();
            toast.success("Задача закрыта");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleDelete = async () => {
        if (!taskId || !projectId || !task) return;
        if (!confirm("Удалить задачу?")) return;
        try {
            await remove({ id: taskId, projectId }).unwrap();
            toast.success("Задача удалена");
            navigate(`${AppRoutes.TASKS}/${projectId}`);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleAddComment = async () => {
        if (!taskId || !commentText.trim()) return;
        try {
            const commentId = await addComment({
                taskId,
                content: commentText.trim(),
                replyToUserId: replyTo?.userId ?? null,
                mentionsUserIds: mentionIds.length ? mentionIds : null,
                parentCommentId: replyParentCommentId,
            }).unwrap();

            if (files.length) {
                await uploadAttachments({ commentId, files, taskId }).unwrap();
            }
            setCommentText("");
            setReplyTo(null);
            setReplyParentCommentId(null);
            setMentionIds([]);
            setFiles([]);
            toast.success("Комментарий добавлен");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const startEdit = (id: string, content: string) => {
        setEditingId(id);
        setEditContent(content);
    };

    const saveEdit = async () => {
        if (!editingId || !editContent.trim()) return;
        try {
            await updateComment({ id: editingId, content: editContent.trim() }).unwrap();
            setEditingId(null);
            toast.success("Комментарий обновлён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const removeComment = async (id: string) => {
        if (!confirm("Удалить комментарий?")) return;
        try {
            await deleteCommentMut({ id }).unwrap();
            toast.success("Комментарий удалён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    if (!projectId || !taskId) return null;
    if (isLoading || !task) {
        return (
            <div className="container mx-auto min-w-0 max-w-full px-3 py-6 sm:px-4 sm:py-8">
                <p className="text-muted-foreground">{isLoading ? "Загрузка…" : "Задача не найдена"}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto w-full min-w-0 max-w-4xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-7 lg:py-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => navigate(`${AppRoutes.TASKS}/${projectId}`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    К доске
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`${AppRoutes.TASKS}/${projectId}/edit/${taskId}`)}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Изменить
                </Button>
                {doneColumnId && !task.status.isDoneColumn && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleCloseTask()}
                        disabled={closing}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Закрыть задачу
                    </Button>
                )}
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                </Button>
            </div>
            <div>
                <p className="text-sm text-muted-foreground mb-1">{task.key}</p>
                <h1 className="text-2xl sm:text-3xl font-bold break-words">{task.title}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary">{task.status.name}</Badge>
                    <Badge variant="outline">{task.priority}</Badge>
                    {task.deadline && (
                        <Badge variant="outline">
                            Срок: {format(parseISO(task.deadline), "d MMMM yyyy", { locale: ru })}
                        </Badge>
                    )}
                </div>
            </div>
            {task.description && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Описание</CardTitle>
                    </CardHeader>
                    <CardContent className="whitespace-pre-wrap break-words">{task.description}</CardContent>
                </Card>
            )}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        База знаний
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Статьи по этой задаче (и по проекту целиком).</p>
                    <Link
                        to={`${AppRoutes.KNOWLEDGE}?projectId=${projectId}&taskId=${taskId}`}
                        className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                    >
                        Открыть статьи по задаче
                    </Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Комментарии</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {(replyTo || replyParentCommentId) && (
                            <div className="text-xs text-muted-foreground">
                                {replyTo && (
                                    <>
                                        Ответ пользователю: <span className="font-medium">{replyTo.authorName}</span>
                                    </>
                                )}
                                {replyParentCommentId && (
                                    <span className={replyTo ? " ml-2" : ""}> (ветка комментария)</span>
                                )}
                                <button
                                    type="button"
                                    className="underline ml-2"
                                    onClick={() => {
                                        setReplyTo(null);
                                        setReplyParentCommentId(null);
                                    }}
                                >
                                    отменить
                                </button>
                            </div>
                        )}
                        {mentionMembers.length ? (
                            <div className="flex flex-wrap gap-2">
                                {mentionMembers.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className="text-xs px-2 py-1 rounded-md border hover:bg-accent"
                                        onClick={() => {
                                            if (!mentionIds.includes(m.id)) setMentionIds([...mentionIds, m.id]);
                                            setCommentText((prev) =>
                                                prev.trim().length ? `${prev} @${m.name}` : `@${m.name}`,
                                            );
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
                                disabled={addingComment || uploading}
                                onFiles={(picked) => setFiles((prev) => [...prev, ...picked])}
                                label="Прикрепить файлы"
                            />
                            {files.length > 0 && (
                                <span className="text-xs text-muted-foreground break-all">
                                    {files.map((f) => f.name).join(", ")}
                                </span>
                            )}
                        </div>
                        <Textarea
                            placeholder="Новый комментарий…"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={3}
                        />
                        <Button onClick={handleAddComment} disabled={addingComment || uploading || !commentText.trim()}>
                            Отправить
                        </Button>
                    </div>
                    <div className="space-y-8">
                        {task.comments.map((c) => (
                            <TaskCommentItem
                                key={c.id}
                                comment={c}
                                level={0}
                                currentUserId={currentUserId}
                                editingId={editingId}
                                editContent={editContent}
                                deletingComment={deletingComment}
                                updatingComment={updatingComment}
                                onReply={(comment) => {
                                    setReplyParentCommentId(comment.id);
                                    setReplyTo({ userId: comment.userId, authorName: comment.authorName });
                                }}
                                onStartEdit={startEdit}
                                onSaveEdit={() => void saveEdit()}
                                onEditContentChange={setEditContent}
                                onRemove={(id) => void removeComment(id)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">История</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <TaskHistory history={task.history} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
