import type { CommentAttachmentDto } from "../attachments/CommentAttachmentDto";

export interface ProjectCommentDto {
    id: string;
    projectId: string;
    content: string;              // текст комментария (может быть markdown)
    author: {
        id: string;
        name: string;
        avatarUrl?: string;
        hasAvatar?: boolean;
        email?: string;
    };
    createdAt: string;            // ISO
    updatedAt?: string;           // ISO, если редактировался
    parentId?: string;            // для ответов (null = корневой комментарий)
    replies?: ProjectCommentDto[];   // вложенные ответы (опционально загружаются отдельно)
    attachments?: CommentAttachmentDto[];
}
