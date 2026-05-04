import type { CommentAttachmentDto } from "../attachments/CommentAttachmentDto";

export interface TaskCommentDto {
    id: string;
    taskId: string;
    userId: string;
    authorName: string;
    authorHasAvatar?: boolean;
    content: string;
    createdAt: string;
    updatedAt: string;
    parentCommentId?: string | null;
    replies?: TaskCommentDto[];
    attachments?: CommentAttachmentDto[];
}
