import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui_shadcn/avatar";
import { authLocalService } from "@/shared/lib";
import { env } from "@/env";
import { cn } from "@/shared/lib/ui_shadcn/utils";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10",
    lg: "h-12 w-12",
};

/** Подгружает аватар отдельным запросом (не блокирует список). */
export function UserAvatar({
    userId,
    name,
    className,
    size = "md",
}: {
    userId: string;
    name?: string | null;
    className?: string;
    size?: Size;
}) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;

        const load = async () => {
            const token = authLocalService.getToken();
            if (!token) return;
            try {
                const res = await fetch(`${env.VITE_API_BASE_URL}/profile/users/${userId}/avatar`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok || cancelled) return;
                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);
                if (!cancelled) setSrc(objectUrl);
            } catch {
                /* сеть / 404 — остаётся fallback */
            }
        };

        void load();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [userId]);

    const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

    return (
        <Avatar className={cn(sizeClass[size], className)}>
            {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
    );
}
