"use client";

import { useEffect, useState, useCallback } from "react";
import { getApiErrorMessage } from "@/shared/lib";
import { fetchFileBlob } from "@/shared/lib/files";
import type { CommentAttachmentDto } from "@/types/dto/attachments/CommentAttachmentDto";
import { Button } from "@/shared/ui_shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui_shadcn/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteStoredFileMutation } from "@/shared/api/filesApi";

type Props = {
    attachment: CommentAttachmentDto;
    /** Показать кнопку удаления (права проверяются на сервере). */
    showDelete?: boolean;
};

/** Вложение: превью в диалоге (изображения/PDF), скачивание через авторизованный запрос; опционально удаление. */
export function CommentAttachmentLink({ attachment, showDelete = false }: Props) {
    const [open, setOpen] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteFile, { isLoading: deleting }] = useDeleteStoredFileMutation();

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        let createdUrl: string | null = null;

        (async () => {
            setLoading(true);
            setError(null);
            setBlobUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            try {
                const blob = await fetchFileBlob(attachment.id);
                createdUrl = URL.createObjectURL(blob);
                if (!cancelled) setBlobUrl(createdUrl);
            } catch (e) {
                if (!cancelled) setError(getApiErrorMessage(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
    }, [open, attachment.id]);

    const ct = attachment.contentType ?? "";
    const lowerName = attachment.fileName.toLowerCase();
    const isImage = ct.startsWith("image/");
    const isPdf = ct === "application/pdf" || lowerName.endsWith(".pdf");
    const isOfficeDoc =
        /word|officedocument|msword|spreadsheet|excel|powerpoint|presentation/i.test(ct) ||
        /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);

    const handleDownload = useCallback(() => {
        if (!blobUrl) return;
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = attachment.fileName;
        a.click();
    }, [blobUrl, attachment.fileName]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Удалить вложение «" + attachment.fileName + "»?")) return;
        try {
            await deleteFile(attachment.id).unwrap();
            toast.success("Вложение удалено");
            setOpen(false);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className="text-xs text-primary underline underline-offset-2 w-fit break-all text-left hover:no-underline"
                    onClick={() => setOpen(true)}
                >
                    {attachment.fileName}{" "}
                    <span className="text-muted-foreground">
                        ({Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB)
                    </span>
                </button>
                {showDelete ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Удалить вложение"
                        disabled={deleting}
                        onClick={(e) => void handleDelete(e)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                ) : null}
            </div>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) {
                        setBlobUrl((u) => {
                            if (u) URL.revokeObjectURL(u);
                            return null;
                        });
                        setError(null);
                        setLoading(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl" showCloseButton>
                    <DialogHeader>
                        <DialogTitle className="truncate pr-8">{attachment.fileName}</DialogTitle>
                    </DialogHeader>
                    <div className="min-h-[120px] max-h-[75vh] overflow-auto py-2">
                        {loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {!loading && !error && blobUrl && isImage && (
                            <img
                                src={blobUrl}
                                alt=""
                                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md border"
                            />
                        )}
                        {!loading && !error && blobUrl && isPdf && (
                            <iframe
                                title={attachment.fileName}
                                src={blobUrl}
                                className="h-[70vh] w-full rounded-md border"
                            />
                        )}
                        {!loading && !error && blobUrl && !isImage && !isPdf && isOfficeDoc && (
                            <p className="text-sm text-muted-foreground">
                                Документ Office — встроенный предпросмотр недоступен. Нажмите «Скачать», чтобы открыть
                                файл в приложении на устройстве.
                            </p>
                        )}
                        {!loading && !error && blobUrl && !isImage && !isPdf && !isOfficeDoc && (
                            <p className="text-sm text-muted-foreground">
                                Предпросмотр недоступен для этого типа файла. Скачайте файл.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="secondary" disabled={!blobUrl || loading} onClick={handleDownload}>
                            Скачать
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Закрыть
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
