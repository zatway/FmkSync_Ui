"use client";

import { useEffect, useMemo, useState } from "react";
import { useGetMeAvatarQuery, useGetMeInfoQuery, useUpdateProfileMutation } from "@/modules/profile/api/profileApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Button } from "@/shared/ui_shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui_shadcn/avatar";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { FilePickerButton } from "@/shared/ui/FilePickerButton";

export default function ProfilePage() {
    const { data: user } = useGetMeInfoQuery();
    const { data: avatarBlob } = useGetMeAvatarQuery(undefined, { skip: !user?.hasAvatar });
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const initials = useMemo(() => {
        if (!user?.fullName) return "U";
        return user.fullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [user?.fullName]);

    useEffect(() => {
        if (!user?.hasAvatar) {
            setAvatarUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }
        if (!avatarBlob) return;
        const url = URL.createObjectURL(avatarBlob);
        setAvatarUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [user?.hasAvatar, avatarBlob]);

    const onPickAvatar = async (file: File | null) => {
        if (!file) return;
        try {
            await updateProfile({ avatarFile: file }).unwrap();
            toast.success("Аватар обновлён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const onDeleteAvatar = async () => {
        try {
            await updateProfile({ isDeletedAvatar: true }).unwrap();
            toast.success("Аватар удалён");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="container mx-auto min-w-0 max-w-3xl space-y-5 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-8">
            <h1 className="text-2xl font-bold">Профиль</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Аватар</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <Avatar className="h-20 w-20">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <FilePickerButton
                                accept="image/*"
                                disabled={isLoading}
                                label="Выбрать изображение"
                                onFiles={(f) => void onPickAvatar(f[0] ?? null)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={isLoading}
                                onClick={() => void onDeleteAvatar()}
                            >
                                Удалить аватар
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Данные</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">ФИО:</span> {user?.fullName ?? "—"}</div>
                    <div><span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}</div>
                    <div><span className="text-muted-foreground">Отдел:</span> {user?.departmentName ?? "—"}</div>
                    <div><span className="text-muted-foreground">Должность:</span> {user?.positionName ?? "—"}</div>
                </CardContent>
            </Card>
        </div>
    );
}

