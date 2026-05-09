import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Progress } from "@/shared/ui_shadcn/progress";
import { ProjectDetailedDto } from "@/types/dto/projects/ProjectDetailedDto";
import {format} from "date-fns";
import {cn} from "@/shared/lib/ui_shadcn/utils";
import { ru } from "date-fns/locale";
import { isSystemSeededAdminDisplayName } from "@/shared/lib/users/systemSeededAdminDisplay";

interface Props {
    project: ProjectDetailedDto;
}

export function ProjectOverview({ project }: Props) {
    const memberCount = (project.members ?? []).filter((m) => !isSystemSeededAdminDisplayName(m.name)).length;
    return (
        <div className="space-y-8">
            {project.description && (
                <Card>
                    <CardHeader>
                        <CardTitle>Описание проекта</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {project.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Прогресс и задачи</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {project.progress !== undefined && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Общий прогресс</span>
                                <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-3" />
                            {project.taskStats?.total === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Доля завершённых задач появится после добавления задач в проект.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <StatItem title="Всего задач" value={project.taskStats?.total || 0} />
                        <StatItem title="Открыта" value={project.taskStats?.open || 0} color="text-amber-600" />
                        <StatItem title="Участники" value={memberCount} />
                        <StatItem
                            title="Последняя активность"
                            value={
                                project.updatedAt
                                    ? format(new Date(project.updatedAt), "d MMM yyyy, HH:mm", { locale: ru })
                                    : "—"
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatItem({ title, value, color = "text-foreground" }: { title: string; value: number | string; color?: string }) {
    return (
        <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-semibold", color)}>{value}</p>
        </div>
    );
}
