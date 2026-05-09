import {useEffect, useMemo, useState} from "react";
import {generatePath, Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Button} from "@/shared/ui_shadcn/button";
import {Input} from "@/shared/ui_shadcn/input";
import {Textarea} from "@/shared/ui_shadcn/textarea";
import {Label} from "@/shared/ui_shadcn/label";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/shared/ui_shadcn/dialog";
import {
    useCreateKnowledgeArticleMutation,
    useDeleteKnowledgeArticleMutation,
    useGetKnowledgeArticleQuery,
    useGetKnowledgeArticlesQuery,
    useUpdateKnowledgeArticleMutation,
    useUploadKnowledgeAttachmentsMutation,
    type KnowledgeArticleDetail,
} from "@/modules/knowledge/api/knowledgeApi";
import {AppRoutes} from "@/app/routes/AppRoutes";
import {authLocalService, getApiErrorMessage} from "@/shared/lib";
import {UserRole} from "@/types/dto/enums/UserRole";
import {env} from "@/env";
import {BookOpen, FolderOpen, ListTree} from "lucide-react";
import {KnowledgeTree} from "@/modules/knowledge/components/KnowledgeTree";
import {buildKnowledgeTree} from "@/modules/knowledge/lib/knowledgeTree";
import { KnowledgeMarkdownBody } from "@/modules/knowledge/components/KnowledgeMarkdownBody";
import {useGetProjectsQuery} from "@/modules/projects/api/projectsApi";
import {toast} from "sonner";
import {FilePickerButton} from "@/shared/ui/FilePickerButton";
import {CommentAttachmentLink} from "@/shared/ui/CommentAttachmentLink";

export function KnowledgeBaseView() {
    const {slug} = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = authLocalService.getUserRole();
    const canEdit = role === UserRole.Admin || role === UserRole.Manager;

    const projectIdFilter = searchParams.get("projectId") ?? undefined;
    const listParams = useMemo(
        () =>
            projectIdFilter
                ? {projectId: projectIdFilter}
                : {},
        [projectIdFilter],
    );

    const searchSuffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

    const {data: list, isLoading: listLoading} = useGetKnowledgeArticlesQuery(listParams);
    const {data: article, isLoading: artLoading} = useGetKnowledgeArticleQuery(slug ?? "", {
        skip: !slug,
    });

    const [createArticle, {isLoading: creating}] = useCreateKnowledgeArticleMutation();
    const [updateArticle, {isLoading: updating}] = useUpdateKnowledgeArticleMutation();
    const [deleteArticle, {isLoading: deleting}] = useDeleteKnowledgeArticleMutation();
    const [uploadKnowledgeAttachments, {isLoading: uploadingKb}] = useUploadKnowledgeAttachmentsMutation();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editMode, setEditMode] = useState(false);
    /** Ответ POST create до того, как подтянется GET по slug (чтобы сразу грузить вложения). */
    const [bootstrapArticle, setBootstrapArticle] = useState<KnowledgeArticleDetail | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [kbAttachFiles, setKbAttachFiles] = useState<File[]>([]);
    const { data: projects = [] } = useGetProjectsQuery({ includeArchived: true });

    const effectiveArticle = article ?? bootstrapArticle;

    const tree = useMemo(() => buildKnowledgeTree(list ?? []), [list]);

    const filteredProjectTitle = useMemo(() => {
        if (!projectIdFilter) return null;
        const fromArticle = list?.find((a) => a.projectId === projectIdFilter)?.projectName;
        if (fromArticle) return fromArticle;
        return projects.find((p) => p.id === projectIdFilter)?.name ?? null;
    }, [projectIdFilter, list, projects]);

    useEffect(() => {
        if (article) {
            setTitle(article.title);
            setContent(article.contentMarkdown);
        }
    }, [article?.id, article?.updatedAt, article?.title, article?.contentMarkdown]);

    useEffect(() => {
        if (article?.id && bootstrapArticle && article.id === bootstrapArticle.id) {
            setBootstrapArticle(null);
        }
    }, [article?.id, bootstrapArticle]);

    useEffect(() => {
        setKbAttachFiles([]);
    }, [article?.id]);

    const openCreate = async () => {
        if (!canEdit) return;
        try {
            setFormError(null);
            setBootstrapArticle(null);
            const created = await createArticle({
                title: "Новая статья",
                contentMarkdown: "",
                projectId: projectIdFilter || undefined,
            }).unwrap();
            setBootstrapArticle(created);
            setTitle(created.title);
            setContent(created.contentMarkdown);
            setEditMode(true);
            navigate(generatePath(env.ROUTE_KNOWLEDGE_ARTICLE, {slug: created.slug}) + searchSuffix);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleAddChild = async (parentId: string) => {
        if (!canEdit) return;
        const parent = list?.find((a) => a.id === parentId);
        try {
            setFormError(null);
            setBootstrapArticle(null);
            const created = await createArticle({
                title: "Новая статья",
                contentMarkdown: "",
                parentId,
                projectId: parent?.projectId ?? projectIdFilter ?? undefined,
            }).unwrap();
            setBootstrapArticle(created);
            setTitle(created.title);
            setContent(created.contentMarkdown);
            setEditMode(true);
            navigate(generatePath(env.ROUTE_KNOWLEDGE_ARTICLE, {slug: created.slug}) + searchSuffix);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleSaveEdit = async () => {
        const art = article ?? bootstrapArticle;
        if (!art) return;
        try {
            setFormError(null);
            await updateArticle({
                id: art.id,
                body: {title, contentMarkdown: content},
            }).unwrap();
            setEditMode(false);
            setBootstrapArticle(null);
        } catch (e) {
            const message = getApiErrorMessage(e);
            setFormError(message);
        }
    };

    const handleUploadKbAttachments = async () => {
        const art = article ?? bootstrapArticle;
        if (!art?.id || kbAttachFiles.length === 0) return;
        try {
            await uploadKnowledgeAttachments({ articleId: art.id, files: kbAttachFiles }).unwrap();
            setKbAttachFiles([]);
            toast.success("Вложения загружены");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const handleDelete = async () => {
        const art = article ?? bootstrapArticle;
        if (!art) return;
        try {
            await deleteArticle(art.id).unwrap();
            toast.success("Статья удалена");
            setDeleteDialogOpen(false);
            navigate({pathname: env.ROUTE_KNOWLEDGE, search: searchParams.toString()});
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const insertAtCursor = (snippet: string) => {
        const el = document.getElementById("kb-body") as HTMLTextAreaElement | null;
        if (el) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            setContent((c) => c.slice(0, start) + snippet + c.slice(end));
            requestAnimationFrame(() => {
                el.focus();
                const pos = start + snippet.length;
                el.setSelectionRange(pos, pos);
            });
        } else {
            setContent((c) => c + snippet);
        }
    };

    const handleInsertImagesInMarkdown = async (files: File[]) => {
        const art = article ?? bootstrapArticle;
        if (!art?.id) {
            toast.error("Статья ещё не готова. Подождите секунду или обновите страницу.");
            return;
        }
        const images = files.filter((f) => f.type.startsWith("image/"));
        if (!images.length) {
            toast.error("Выберите файлы изображений");
            return;
        }
        try {
            const uploaded = await uploadKnowledgeAttachments({ articleId: art.id, files: images }).unwrap();
            let snippet = "";
            for (const a of uploaded) {
                const safeName = a.fileName.replace(/[[\]]/g, "");
                snippet += `\n\n![${safeName}](${a.id})\n\n`;
            }
            insertAtCursor(snippet);
            toast.success(
                images.length === 1
                    ? "Изображение добавлено в текст. Сохраните статью."
                    : "Изображения добавлены. Сохраните статью.",
            );
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 p-3 sm:space-y-6 sm:p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <ListTree className="h-7 w-7 text-primary"/>
                    <h1 className="text-2xl font-semibold tracking-tight">База знаний</h1>
                </div>
                {canEdit && (
                    <Button type="button" variant="outline" onClick={() => void openCreate()} disabled={creating}>
                        Новая статья
                    </Button>
                )}
            </div>

            {projectIdFilter && (
                <div
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary"/>
                    <span>
                        Показаны статьи проекта
                        {filteredProjectTitle ? (
                            <span className="font-medium"> «{filteredProjectTitle}»</span>
                        ) : null}
                        .
                    </span>
                    <Link
                        to={env.ROUTE_KNOWLEDGE}
                        className="ml-auto text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                    >
                        Все статьи
                    </Link>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
                <aside className="rounded-xl border bg-card p-3 text-sm shadow-sm">
                    <div className="mb-3 flex items-center gap-2 font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4"/>
                        Содержание
                    </div>
                    {listLoading && <p className="text-muted-foreground">Загрузка…</p>}
                    {!listLoading && tree.length === 0 && (
                        <p className="text-xs text-muted-foreground">Пока нет статей в этой области.</p>
                    )}
                    {!listLoading && tree.length > 0 && (
                        <KnowledgeTree
                            nodes={tree}
                            searchSuffix={searchSuffix}
                            currentSlug={slug}
                            canEdit={canEdit}
                            onAddChild={handleAddChild}
                            depth={0}
                        />
                    )}
                </aside>

                <section className="min-h-[320px] rounded-xl border bg-card p-4 shadow-sm">
                    {editMode && canEdit && (
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="kb-title">Заголовок</Label>
                                <Input
                                    id="kb-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Название"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Label htmlFor="kb-body">Текст (Markdown)</Label>
                                    {canEdit ? (
                                        <FilePickerButton
                                            accept="image/*"
                                            multiple
                                            disabled={uploadingKb}
                                            label="Изображение в текст"
                                            onFiles={(picked) => void handleInsertImagesInMarkdown(picked)}
                                        />
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Загрузите изображение — в разметку вставится ссылка вида{" "}
                                    <code className="rounded bg-muted px-1">![имя](ka:…)</code>. Между блоками можно
                                    писать обычный текст. Статья уже создана на сервере — вложения доступны сразу.
                                </p>
                                <Textarea
                                    id="kb-body"
                                    className="min-h-[240px] font-mono text-sm"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            {effectiveArticle && canEdit && (
                                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                                    <Label>Вложения к статье</Label>
                                    {effectiveArticle.attachments && effectiveArticle.attachments.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            {effectiveArticle.attachments.map((a) => (
                                                <CommentAttachmentLink key={a.id} attachment={a} />
                                            ))}
                                        </div>
                                    )}
                                    <FilePickerButton
                                        multiple
                                        disabled={uploadingKb}
                                        label="Выбрать файлы"
                                        onFiles={(picked) => setKbAttachFiles((prev) => [...prev, ...picked])}
                                    />
                                    {kbAttachFiles.length > 0 && (
                                        <p className="text-xs text-muted-foreground break-all">
                                            К загрузке: {kbAttachFiles.map((f) => f.name).join(", ")}
                                        </p>
                                    )}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        disabled={uploadingKb || kbAttachFiles.length === 0}
                                        onClick={() => void handleUploadKbAttachments()}
                                    >
                                        {uploadingKb ? "Загрузка…" : "Загрузить вложения"}
                                    </Button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() => void handleSaveEdit()}
                                    disabled={updating || !effectiveArticle}
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditMode(false);
                                        setBootstrapArticle(null);
                                        if (article) {
                                            setTitle(article.title);
                                            setContent(article.contentMarkdown);
                                        }
                                    }}
                                >
                                    Отмена
                                </Button>
                            </div>
                            {formError && (
                                <p className="text-sm text-destructive">{formError}</p>
                            )}
                        </div>
                    )}

                    {!editMode && slug && (
                        <>
                            {artLoading && <p className="text-muted-foreground">Загрузка…</p>}
                            {!artLoading && article && (
                                <article className="prose prose-sm dark:prose-invert max-w-none">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 not-prose">
                                        <h2 className="text-xl font-semibold">{article.title}</h2>
                                        {canEdit && (
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setTitle(article.title);
                                                        setContent(article.contentMarkdown);
                                                        setEditMode(true);
                                                    }}
                                                >
                                                    Править
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialogOpen(true)}
                                                    disabled={deleting}
                                                >
                                                    Удалить
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {article.projectId && (
                                        <div className="not-prose mb-3 flex flex-wrap gap-2 text-xs">
                                            {article.projectId && (
                                                <Link
                                                    to={generatePath(AppRoutes.PROJECT_DETAIL, {
                                                        projectId: article.projectId,
                                                    })}
                                                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 font-medium text-foreground hover:bg-accent"
                                                >
                                                    <FolderOpen className="h-3.5 w-3.5"/>
                                                    {article.projectName ?? article.projectKey ?? "Проект"}
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                    <p className="not-prose text-xs text-muted-foreground">
                                        {article.authorName} ·{" "}
                                        {new Date(
                                            article.updatedAt ?? article.createdAt,
                                        ).toLocaleString("ru-RU")}
                                    </p>
                                    {article.attachments && article.attachments.length > 0 && (
                                        <div className="not-prose mb-4 flex flex-col gap-1">
                                            <p className="text-xs font-medium text-muted-foreground">Вложения</p>
                                            {article.attachments.map((a) => (
                                                <CommentAttachmentLink key={a.id} attachment={a} />
                                            ))}
                                        </div>
                                    )}
                                    <KnowledgeMarkdownBody
                                        markdown={article.contentMarkdown}
                                        className="prose prose-lg prose-headings:text-white prose-p:text-gray-300 prose-strong:text-violet-400 prose-code:text-pink-400 max-w-none"
                                    />
                                </article>
                            )}
                            {!artLoading && !article && (
                                <p className="text-muted-foreground">Статья не найдена.</p>
                            )}
                        </>
                    )}

                    {!editMode && !slug && (
                        <p className="text-muted-foreground">
                            Выберите статью слева или создайте новую (роль администратора или
                            руководителя).
                        </p>
                    )}
                </section>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить статью?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Это действие необратимо. Статья будет удалена без возможности восстановления.
                    </p>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
