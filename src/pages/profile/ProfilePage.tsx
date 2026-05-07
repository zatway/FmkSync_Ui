"use client";

import { useMemo } from "react";
import { useGetMeInfoQuery, useUpdateProfileMutation } from "@/modules/profile/api/profileApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Button } from "@/shared/ui_shadcn/button";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { FilePickerButton } from "@/shared/ui/FilePickerButton";
import { UserAvatar } from "@/shared/ui/UserAvatar";

export default function ProfilePage() {
    const { data: user } = useGetMeInfoQuery();
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();

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
                    {user ? (
                        <UserAvatar
                            userId={user.id}
                            name={user.fullName}
                            hasAvatar={user.hasAvatar}
                            size="xl"
                            className="ring-2 ring-border"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg font-medium">
                            {initials}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <FilePickerButton
                                accept="image/*"
                                disabled={isLoading || !user}
                                label="Выбрать изображение"
                                onFiles={(f) => void onPickAvatar(f[0] ?? null)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={isLoading || !user}
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
                    <div>
                        <span className="text-muted-foreground">ФИО:</span> {user?.fullName ?? "—"}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Отдел:</span> {user?.departmentName ?? "—"}
                    </div>
                    <div>
                        <span className="text-muted-foreground">Должность:</span> {user?.positionName ?? "—"}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
