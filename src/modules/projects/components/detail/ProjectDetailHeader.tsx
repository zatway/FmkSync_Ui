import {ArrowLeft, Delete, Edit} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui_shadcn/button";
import { Badge } from "@/shared/ui_shadcn/badge";
import { ProjectDetailedDto } from "@/types/dto/projects/ProjectDetailedDto";
import { AppRoutes } from "@/app/routes/AppRoutes";
import {useDeleteProjectMutation} from "@/modules/projects/api/projectsApi";

interface Props {
    project: ProjectDetailedDto;
}

export function ProjectDetailHeader({ project }: Props) {
    const navigate = useNavigate();

    const [deleteProject, {isLoading}] = useDeleteProjectMutation();

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center text-3xl shadow-md"
                    style={{ backgroundColor: project.color ? `${project.color}30` : "#3b82f630" }}
                >
                    {project.icon || "📁"}
                </div>
                <div className="min-w-0">
                    <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-base px-3 py-1">
                            {project.key}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                </Button>
                <Button onClick={async () => {
                    await deleteProject(project.id)
                    navigate(AppRoutes.PROJECTS)
                }}>
                    <Delete className="mr-2 h-4 w-4" />
                    {isLoading ? 'Удаление...' : 'Удалить'}
                </Button>
                <Button onClick={() => navigate(`${AppRoutes.PROJECTS}/${project.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать
                </Button>
            </div>
        </div>
    );
}
