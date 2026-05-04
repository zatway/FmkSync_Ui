"use client";

import {
    ProjectDetailSkeleton,
    ProjectDetailHeader,
    ProjectOverview,
    ProjectTeam,
    ProjectTimeline,
    ProjectQuickActions
} from "@/modules/projects";
import {useGetProjectByIdQuery} from "@/modules/projects/api/projectsApi";
import {AlertCircle} from "lucide-react";
import {Button} from "@/shared/ui_shadcn/button";
import {Link, useNavigate, useParams} from "react-router-dom";
import {AppRoutes} from "@/app/routes/AppRoutes";
import {Card, CardContent, CardHeader, CardTitle} from "@/shared/ui_shadcn/card";
import {BookOpen} from "lucide-react";

export default function ProjectDetailPage() {
    const {projectId} = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const {data: project, isLoading, isError} = useGetProjectByIdQuery(projectId!, {
        skip: !projectId,
    });

    if (isLoading) {
        return <ProjectDetailSkeleton/>;
    }

    if (!project || isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <AlertCircle className="h-16 w-16 text-destructive mb-6"/>
                <h2 className="text-2xl font-bold mb-2">Проект не найден</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Возможно, проект был удалён или у вас нет доступа.
                </p>
                <Button onClick={() => navigate(AppRoutes.PROJECTS)}>
                    Вернуться к списку проектов
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto min-w-0 max-w-full py-6 px-3 sm:py-8 sm:px-5 lg:px-8">
            <ProjectDetailHeader project={project}/>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview project={project}/>
                    <ProjectQuickActions projectId={project.id}/>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                База знаний
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p className="mb-3">
                                Статьи и заметки, привязанные к этому проекту.
                            </p>
                            <Link
                                to={`${AppRoutes.KNOWLEDGE}?projectId=${project.id}`}
                                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                            >
                                Открыть документацию проекта
                            </Link>
                        </CardContent>
                    </Card>
                    <ProjectTeam project={project}/>
                    <ProjectTimeline project={project}/>
                </div>
            </div>
        </div>
    );
}
