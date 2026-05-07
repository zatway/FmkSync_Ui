import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui_shadcn/avatar";
import { fetchFileBlob, getUserAvatarFileId } from "@/shared/lib/files";
import { cn } from "@/shared/lib/ui_shadcn/utils";

type Size = "s" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
    s: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-20 w-20 text-lg",
};

export function UserAvatar({
    userId,
    name,
    hasAvatar,
    className,
    size = "md",
}: {
    userId: string;
    name?: string | null;
    hasAvatar: boolean;
    className?: string;
    size?: Size;
}) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!hasAvatar) {
            setSrc((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }

        let cancelled = false;
        let objectUrl: string | null = null;

        const load = async () => {
            try {
                const blob = await fetchFileBlob(getUserAvatarFileId(userId));
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                if (!cancelled) setSrc(objectUrl);
            } catch {
            }
        };

        void load();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [userId, hasAvatar]);

    const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

    return (
        <Avatar className={cn(sizeClass[size], className)}>
            {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
    );
}
