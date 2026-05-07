import { api } from "@/shared/lib";
import type { CommentAttachmentDto } from "@/types/dto/attachments/CommentAttachmentDto";

const base = `/knowledge`;

export type KnowledgeArticleListItem = {
    id: string;
    title: string;
    slug: string;
    parentId?: string | null;
    sortOrder: number;
    updatedAt?: string | null;
    projectId?: string | null;
    projectKey?: string | null;
    projectName?: string | null;
};

export type KnowledgeArticleDetail = {
    id: string;
    title: string;
    slug: string;
    contentMarkdown: string;
    parentId?: string | null;
    authorId: string;
    authorName: string;
    sortOrder: number;
    createdAt: string;
    updatedAt?: string | null;
    projectId?: string | null;
    projectKey?: string | null;
    projectName?: string | null;
    attachments?: CommentAttachmentDto[];
};

export type KnowledgeListParams = {
    projectId?: string;
};

export type CreateKnowledgeBody = {
    title: string;
    slug?: string | null;
    contentMarkdown: string;
    parentId?: string | null;
    sortOrder?: number | null;
    projectId?: string | null;
};

export type UpdateKnowledgeBody = {
    title?: string;
    slug?: string | null;
    contentMarkdown?: string;
    parentId?: string | null;
    sortOrder?: number | null;
    projectId?: string | null;
    scopeChanged?: boolean;
    parentChanged?: boolean;
};

export const knowledgeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getKnowledgeArticles: builder.query<KnowledgeArticleListItem[], KnowledgeListParams | void>({
            query: (arg) => {
                const params = new URLSearchParams();
                if (arg?.projectId) params.set("projectId", arg.projectId);
                const q = params.toString();
                return { url: q ? `${base}?${q}` : base, method: "GET" };
            },
            providesTags: ["Knowledge"],
        }),
        getKnowledgeArticle: builder.query<KnowledgeArticleDetail, string>({
            query: (slug) => ({ url: `${base}/${encodeURIComponent(slug)}`, method: "GET" }),
            providesTags: (_, __, slug) => [{ type: "Knowledge", id: slug }],
        }),
        createKnowledgeArticle: builder.mutation<KnowledgeArticleDetail, CreateKnowledgeBody>({
            query: (data) => ({ url: base, method: "POST", data }),
            invalidatesTags: ["Knowledge"],
        }),
        updateKnowledgeArticle: builder.mutation<
            KnowledgeArticleDetail,
            { id: string; body: UpdateKnowledgeBody }
        >({
            query: ({ id, body }) => ({ url: `${base}/${id}`, method: "PATCH", data: body }),
            invalidatesTags: ["Knowledge"],
        }),
        deleteKnowledgeArticle: builder.mutation<void, string>({
            query: (id) => ({ url: `${base}/${id}`, method: "DELETE" }),
            invalidatesTags: ["Knowledge"],
        }),
        uploadKnowledgeAttachments: builder.mutation<CommentAttachmentDto[], { articleId: string; files: File[] }>({
            query: ({ articleId, files }) => {
                const fd = new FormData();
                files.forEach((f) => fd.append("files", f, f.name));
                return {
                    url: `${base}/${articleId}/attachments`,
                    method: "POST",
                    data: fd,
                };
            },
            invalidatesTags: ["Knowledge"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetKnowledgeArticlesQuery,
    useGetKnowledgeArticleQuery,
    useCreateKnowledgeArticleMutation,
    useUpdateKnowledgeArticleMutation,
    useDeleteKnowledgeArticleMutation,
    useUploadKnowledgeAttachmentsMutation,
} = knowledgeApi;
