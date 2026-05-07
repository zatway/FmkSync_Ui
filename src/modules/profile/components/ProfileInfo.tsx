import { Button } from "@/shared/ui_shadcn/button";
import { useGetMeInfoQuery } from "@/modules/profile/api/profileApi";
import { DropdownMenuTrigger } from "@/shared/ui_shadcn/dropdown-menu";
import { UserAvatar } from "@/shared/ui/UserAvatar";

export function ProfileInfo() {
    const { data: user } = useGetMeInfoQuery();

    if (!user) return null;

    return (
        <DropdownMenuTrigger asChild className="bg-background">
            <Button variant="ghost" className="flex items-center gap-3">
                <UserAvatar
                    userId={user.id}
                    name={user.fullName}
                    hasAvatar={user.hasAvatar}
                    size="sm"
                />

                <div className="text-left hidden md:block">
                    <div className="text-sm font-medium">{user.fullName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
            </Button>
        </DropdownMenuTrigger>
    );
}
