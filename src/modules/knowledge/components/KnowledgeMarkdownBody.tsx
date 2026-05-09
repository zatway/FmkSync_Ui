"use client";

import { useEffect, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchFileBlob } from "@/shared/lib/files";

function MarkdownImg({ src, alt }: { src?: string; alt?: string }) {
    const isPendingPlaceholder = !!(src && /__kb_pending_[0-9a-f-]{36}__/i.test(src));
    const [url, setUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!src || isPendingPlaceholder) return;
        if (/^https?:\/\//i.test(src)) {
            setUrl(src);
            return;
        }
        let cancelled = false;
        let blobUrl: string | null = null;
        (async () => {
            try {
                const raw = src.startsWith("/files/")
                    ? decodeURIComponent(src.slice("/files/".length))
                    : src;
                const blob = await fetchFileBlob(raw);
                blobUrl = URL.createObjectURL(blob);
                if (!cancelled) setUrl(blobUrl);
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [src, isPendingPlaceholder]);

    if (isPendingPlaceholder) {
        return (
            <span className="text-muted-foreground text-sm">
                Плейсхолдер изображения — завершите создание или сохранение статьи.
            </span>
        );
    }
    if (failed) {
        return <span className="text-destructive text-sm">Не удалось загрузить изображение</span>;
    }
    if (!url) {
        return <span className="text-muted-foreground text-sm">Загрузка изображения…</span>;
    }
    return (
        <img
            src={url}
            alt={alt ?? ""}
            className="my-4 max-h-[min(480px,70vh)] max-w-full rounded-md border object-contain"
        />
    );
}

type Props = {
    markdown: string;
    className?: string;
};

/** Разрешаем встроенные вложения БЗ (`ka:…`) — иначе react-markdown обнуляет src. */
function knowledgeUrlTransform(href: string): string {
    const v = String(href || "").trim();
    if (/^ka:/i.test(v)) return v;
    return defaultUrlTransform(href);
}

export function KnowledgeMarkdownBody({ markdown, className }: Props) {
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={knowledgeUrlTransform}
                components={{
                    img: (props) => <MarkdownImg src={props.src} alt={props.alt} />,
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
