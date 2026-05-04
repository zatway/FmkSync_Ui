import { Plus } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { authLocalService } from "@/shared/lib";
import { UserRole } from "@/types/dto/enums/UserRole";

export function ProjectsTableHeader() {
    const navigate = useNavigate();
    const role = authLocalService.getUserRole();
    const canCreateProject = role === UserRole.Admin || role === UserRole.Manager;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Таблица проектов</h1>
                <p className="text-muted-foreground mt-1">
                    Полный список с фильтрами, сортировкой и действиями
                </p>
            </div>

            {canCreateProject ? (
                <Button onClick={() => navigate(AppRoutes.PROJECT_CREATE)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Новый проект
                </Button>
            ) : null}
        </div>
    );
}
