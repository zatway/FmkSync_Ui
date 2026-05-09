import { useState } from "react";
import { ArrowLeft, Archive, ArchiveRestore, Delete, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui_shadcn/button";
import { Badge } from "@/shared/ui_shadcn/badge";
import { ProjectDetailedDto } from "@/types/dto/projects/ProjectDetailedDto";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { useDeleteProjectMutation, useUpdateProjectMutation } from "@/modules/projects/api/projectsApi";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui_shadcn/dialog";
import { PROJECT_DELETE_DETAIL_LINES } from "@/modules/projects/lib/projectDeleteConfirm";

interface Props {
    project: ProjectDetailedDto;
}

export function ProjectDetailHeader({ project }: Props) {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();
    const [updateProject, { isLoading: archiving }] = useUpdateProjectMutation();

    const toggleArchive = async () => {
        try {
            await updateProject({ id: project.id, isArchived: !project.isArchived }).unwrap();
            toast.success(project.isArchived ? "Проект возвращён из архива" : "Проект отправлен в архив");
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteProject(project.id).unwrap();
            toast.success("Проект удалён");
            setDeleteDialogOpen(false);
            navigate(AppRoutes.PROJECTS);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl shadow-md"
                    style={{ backgroundColor: project.color ? `${project.color}30` : "#3b82f630" }}
                >
                    {project.icon || "📁"}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                        {project.isArchived ? (
                            <Badge variant="secondary" className="shrink-0">
                                Архив
                            </Badge>
                        ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                        <Badge variant="outline" className="text-base px-3 py-1">
                            {project.key}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                </Button>
                <Button type="button" onClick={() => navigate(`${AppRoutes.PROJECTS}/${project.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Изменить
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void toggleArchive()}
                    disabled={archiving}
                >
                    {project.isArchived ? (
                        <>
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Из архива
                        </>
                    ) : (
                        <>
                            <Archive className="mr-2 h-4 w-4" />
                            В архив
                        </>
                    )}
                </Button>
                <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
                    <Delete className="mr-2 h-4 w-4" />
                    Удалить
                </Button>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Удалить проект «{project.name}»?</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
                                <p>Это действие нельзя отменить.</p>
                                <ul className="list-disc space-y-1 pl-5">
                                    {PROJECT_DELETE_DETAIL_LINES.map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
                            {deleting ? "Удаление…" : "Удалить навсегда"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
