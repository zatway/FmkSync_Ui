"use client";

import { ProjectKanbanBoard } from "@/modules/tasks";
import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery } from "@/modules/projects/api/projectsApi";

export default function TaskDashboardPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project } = useGetProjectByIdQuery(projectId!, { skip: !projectId });

    return (
        <div className="min-h-0 min-w-0 max-w-full overflow-x-clip bg-background">
            <div className="container mx-auto min-w-0 max-w-full px-3 py-5 sm:px-5 sm:py-7 lg:px-8 lg:py-8">
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Задачи проекта</h1>
                        <p className="text-muted-foreground mt-1">
                            {project ? `${project.icon ?? ""} ${project.name}`.trim() : projectId}
                        </p>
                    </div>
                </div>
                {projectId && <ProjectKanbanBoard projectId={projectId} />}
            </div>
        </div>
    );
}
