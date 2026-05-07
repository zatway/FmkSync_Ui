export interface CommentAttachmentDto {
    id: string;
    fileName: string;
    contentType?: string | null;
    sizeBytes: number;
    createdAt: string;
}

