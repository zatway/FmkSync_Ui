export interface AddTaskCommentRequest {
    taskId: string;
    content: string;
    mentionsUserIds?: string[] | null;
    replyToUserId?: string | null;
    parentCommentId?: string | null;
}
