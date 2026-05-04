"use client";

import { useEffect, useState } from "react";
import { ProjectEditHeader, ProjectForm } from "@/modules/projects";
import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery, useUpdateProjectMutation } from "@/modules/projects/api/projectsApi";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import {UpdateProjectRequest} from "@/types/dto/projects/UpdateProjectRequest";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import { Label } from "@/shared/ui_shadcn/label";
import { Button } from "@/shared/ui_shadcn/button";

export default function ProjectEditPage() {
    const { projectId } = useParams<{ projectId: string }>();

    const { data: project, isLoading } = useGetProjectByIdQuery(projectId!);
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
    const [archived, setArchived] = useState(false);

    useEffect(() => {
        if (project) setArchived(!!project.isArchived);
    }, [project?.id, project?.isArchived]);

    if (isLoading) {
        return <div className="p-10 text-center">Загрузка...</div>;
    }

    if (!project) {
        return <div>Проект не найден</div>;
    }

    const handleSubmit = async (values: UpdateProjectRequest ) => {
        try {
            await updateProject({ id: projectId!, ...values }).unwrap();
            toast.success("Проект обновлён");
            return projectId!
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <ProjectEditHeader projectName={project.name} />

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden mt-8">
                <ProjectForm
                    submitLabel="Сохранить изменения"
                    isLoading={isUpdating}
                    showSuccessToast={false}
                    navigateToProjectAfterSubmit={false}
                    initialValues={{
                        name: project.name,
                        key: project.key,
                        description: project.description || "",
                        startDate: project.startDate ? new Date(project.startDate) : undefined,
                        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
                        color: project.color,
                        icon: project.icon,
                        tags: project.tags || [],
                        departmentId: project.departmentId ?? "",
                    }}
                    onSubmit={value => handleSubmit({
                        name: value.name,
                        description: value.description,
                        key: value.key,
                        startDate: value.startDate?.toISOString(),
                        dueDate: value.dueDate?.toISOString(),
                        color: value.color,
                        icon: value.icon,
                        tags: value.tags,
                        isArchived: archived,
                        departmentId: value.departmentId,
                    })}
                />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                <Checkbox
                    id="project-archived"
                    checked={archived}
                    onCheckedChange={(v) => setArchived(v === true)}
                />
                <Label htmlFor="project-archived" className="cursor-pointer font-normal">
                    Проект в архиве (скрыт из списка по умолчанию)
                </Label>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={async () => {
                        try {
                            await updateProject({ id: projectId!, isArchived: archived }).unwrap();
                            toast.success("Статус архива сохранён");
                        } catch (err) {
                            toast.error(getApiErrorMessage(err));
                        }
                    }}
                >
                    Сохранить архив
                </Button>
            </div>
        </div>
    );
}
