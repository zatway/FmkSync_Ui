import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui_shadcn/avatar";
import { authLocalService } from "@/shared/lib";
import { env } from "@/env";
import { cn } from "@/shared/lib/ui_shadcn/utils";

type Size = "s" | "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
    s: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10",
    lg: "h-12 w-12",
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
            const token = authLocalService.getToken();
            if (!token) return;
            try {
                const res = await fetch(`${env.VITE_API_BASE_URL}/api/v1/profile/users/${userId}/avatar`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok || cancelled) return;
                const blob = await res.blob();
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
