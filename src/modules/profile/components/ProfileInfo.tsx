import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui_shadcn/avatar";
import {Button} from "@/shared/ui_shadcn/button";
import {useGetMeAvatarQuery, useGetMeInfoQuery} from "@/modules/profile/api/profileApi";
import {useEffect, useState} from "react";
import {DropdownMenuTrigger} from "@/shared/ui_shadcn/dropdown-menu";

export function ProfileInfo() {
    const { data: user } = useGetMeInfoQuery();
    const { data: avatar } = useGetMeAvatarQuery(undefined, { skip: !user?.hasAvatar });

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.hasAvatar) {
            setAvatarUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }
        if (!avatar) return;

        const url = URL.createObjectURL(avatar);
        setAvatarUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [user?.hasAvatar, avatar]);

    if (!user) return null;

    return (
        <DropdownMenuTrigger asChild className="bg-background">
            <Button variant="ghost" className="flex items-center gap-3">
                <Avatar>
                    {avatarUrl && <AvatarImage src={avatarUrl}/>}
                    <AvatarFallback>
                        {user?.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                </Avatar>

                <div className="text-left hidden md:block">
                    <div className="text-sm font-medium">
                        {user.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {user.email}
                    </div>
                </div>
            </Button>
        </DropdownMenuTrigger>
    );
}
