import {useEffect, useMemo, useState} from "react";
import {generatePath, Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Button} from "@/shared/ui_shadcn/button";
import {Input} from "@/shared/ui_shadcn/input";
import {Textarea} from "@/shared/ui_shadcn/textarea";
import {Label} from "@/shared/ui_shadcn/label";
import {
    useCreateKnowledgeArticleMutation,
    useDeleteKnowledgeArticleMutation,
    useGetKnowledgeArticleQuery,
    useGetKnowledgeArticlesQuery,
    useUpdateKnowledgeArticleMutation,
} from "@/modules/knowledge/api/knowledgeApi";
import {AppRoutes} from "@/app/routes/AppRoutes";
import {authLocalService, getApiErrorMessage} from "@/shared/lib";
import {UserRole} from "@/types/dto/enums/UserRole";
import {env} from "@/env";
import {BookOpen, FolderOpen, ListTree} from "lucide-react";
import {KnowledgeTree} from "@/modules/knowledge/components/KnowledgeTree";
import {buildKnowledgeTree} from "@/modules/knowledge/lib/knowledgeTree";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function KnowledgeBaseView() {
    const {slug} = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = authLocalService.getUserRole();
    const canEdit = role === UserRole.Admin || role === UserRole.Manager;

    const projectIdFilter = searchParams.get("projectId") ?? undefined;
    const taskIdFilter = searchParams.get("taskId") ?? undefined;
    const listParams = useMemo(
        () =>
            projectIdFilter || taskIdFilter
                ? {projectId: projectIdFilter, taskId: taskIdFilter}
                : undefined,
        [projectIdFilter, taskIdFilter],
    );

    const searchSuffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

    const {data: list, isLoading: listLoading} = useGetKnowledgeArticlesQuery(listParams);
    const {data: article, isLoading: artLoading} = useGetKnowledgeArticleQuery(slug ?? "", {
        skip: !slug,
    });

    const [createArticle, {isLoading: creating}] = useCreateKnowledgeArticleMutation();
    const [updateArticle, {isLoading: updating}] = useUpdateKnowledgeArticleMutation();
    const [deleteArticle, {isLoading: deleting}] = useDeleteKnowledgeArticleMutation();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);

    const tree = useMemo(() => buildKnowledgeTree(list ?? []), [list]);

    const scopeLabel = useMemo(() => {
        if (!list?.length) return null;
        const first = list[0];
        if (taskIdFilter && first.taskDisplayKey)
            return `Задача ${first.taskDisplayKey}${first.projectName ? ` · ${first.projectName}` : ""}`;
        if (projectIdFilter && first.projectName) return `Проект «${first.projectName}»`;
        if (projectIdFilter) return "Фильтр по проекту";
        if (taskIdFilter) return "Фильтр по задаче";
        return null;
    }, [list, projectIdFilter, taskIdFilter]);

    useEffect(() => {
        if (article) {
            setTitle(article.title);
            setContent(article.contentMarkdown);
        }
    }, [article?.id, article?.updatedAt, article?.title, article?.contentMarkdown]);

    const openCreate = () => {
        setTitle("");
        setContent("");
        setParentIdForCreate(null);
        setEditMode(true);
        navigate({pathname: env.ROUTE_KNOWLEDGE, search: searchParams.toString()});
    };

    const handleAddChild = (parentId: string) => {
        setParentIdForCreate(parentId);
        setTitle("");
        setContent("");
        setEditMode(true);
        navigate({pathname: env.ROUTE_KNOWLEDGE, search: searchParams.toString()});
    };

    const handleCreate = async () => {
        try {
            const created = await createArticle({
                title,
                contentMarkdown: content,
                parentId: parentIdForCreate ?? undefined,
                projectId: projectIdFilter ?? undefined,
                projectTaskId: taskIdFilter ?? undefined,
            }).unwrap();
            setEditMode(false);
            setParentIdForCreate(null);
            navigate(
                generatePath(env.ROUTE_KNOWLEDGE_ARTICLE, {slug: created.slug}) + searchSuffix,
            );
        } catch (e) {
            alert(getApiErrorMessage(e));
        }
    };

    const handleSaveEdit = async () => {
        if (!article) return;
        try {
            await updateArticle({
                id: article.id,
                body: {title, contentMarkdown: content},
            }).unwrap();
            setEditMode(false);
        } catch (e) {
            alert(getApiErrorMessage(e));
        }
    };

    const handleDelete = async () => {
        if (!article || !confirm("Удалить статью?")) return;
        try {
            await deleteArticle(article.id).unwrap();
            navigate({pathname: env.ROUTE_KNOWLEDGE, search: searchParams.toString()});
        } catch (e) {
            alert(getApiErrorMessage(e));
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <ListTree className="h-7 w-7 text-primary"/>
                    <h1 className="text-2xl font-semibold tracking-tight">База знаний</h1>
                </div>
                {canEdit && (
                    <Button type="button" variant="outline" onClick={openCreate}>
                        Новая статья
                    </Button>
                )}
            </div>

            {(projectIdFilter || taskIdFilter) && (
                <div
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary"/>
                    <span className="text-muted-foreground">Область:</span>
                    <span className="font-medium">{scopeLabel ?? "…"}</span>
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
                            {parentIdForCreate && (
                                <p className="text-xs text-muted-foreground">
                                    Родительская статья выбрана (дочерняя запись).
                                </p>
                            )}
                            <div>
                                <Label htmlFor="kb-title">Заголовок</Label>
                                <Input
                                    id="kb-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Название"
                                />
                            </div>
                            <div>
                                <Label htmlFor="kb-body">Текст (Markdown)</Label>
                                <Textarea
                                    id="kb-body"
                                    className="min-h-[240px] font-mono text-sm"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        slug && article ? void handleSaveEdit() : void handleCreate()
                                    }
                                    disabled={creating || updating || (!!slug && !article)}
                                >
                                    {slug && article ? "Сохранить" : "Создать"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditMode(false);
                                        setParentIdForCreate(null);
                                    }}
                                >
                                    Отмена
                                </Button>
                            </div>
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
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                >
                                                    Удалить
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {(article.projectId ||
                                        article.projectTaskId ||
                                        article.taskDisplayKey) && (
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
                                            {article.projectTaskId && article.projectId && (
                                                <Link
                                                    to={`${AppRoutes.TASKS}/${article.projectId}/detail/${article.projectTaskId}`}
                                                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 font-medium text-foreground hover:bg-accent"
                                                >
                                                    {article.taskDisplayKey ?? "Задача"}
                                                    {article.taskTitle ? ` — ${article.taskTitle}` : ""}
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
                                    <article className="prose prose-lg prose-headings:text-white prose-p:text-gray-300
                        prose-strong:text-violet-400 prose-code:text-pink-400
                        max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {article.contentMarkdown}
                                        </ReactMarkdown>
                                    </article>
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
        </div>
    );
}
