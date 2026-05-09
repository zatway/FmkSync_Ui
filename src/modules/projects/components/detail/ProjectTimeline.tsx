import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ru } from "date-fns/locale";
import { ProjectDetailedDto } from "@/types/dto/projects/ProjectDetailedDto";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { isMeaningfulIsoDate } from "@/shared/lib/dates/meaningfulDate";

interface Props {
    project: ProjectDetailedDto;
}

export function ProjectTimeline({ project }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Сроки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isMeaningfulIsoDate(project.startDate) && (
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Начало</p>
                            <p className="text-sm text-muted-foreground">
                                {format(parseISO(project.startDate as string), "d MMMM yyyy", { locale: ru })}
                            </p>
                        </div>
                    </div>
                )}

                {isMeaningfulIsoDate(project.dueDate) && (
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Срок завершения</p>
                            <p
                                className={cn(
                                    "text-sm",
                                    isPast(parseISO(project.dueDate as string)) && "text-destructive font-medium"
                                )}
                            >
                                {format(parseISO(project.dueDate as string), "d MMMM yyyy", { locale: ru })}
                                {isPast(parseISO(project.dueDate as string)) && " (просрочен)"}
                            </p>
                        </div>
                    </div>
                )}

                {isMeaningfulIsoDate(project.completedAt) && (
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-emerald-600" />
                        <div>
                            <p className="text-sm font-medium">Завершён</p>
                            <p className="text-sm text-muted-foreground">
                                {format(parseISO(project.completedAt as string), "d MMMM yyyy", { locale: ru })}
                            </p>
                        </div>
                    </div>
                )}

                {!isMeaningfulIsoDate(project.startDate) && !isMeaningfulIsoDate(project.dueDate) && (
                    <p className="text-sm text-muted-foreground italic">Сроки не установлены</p>
                )}
            </CardContent>
        </Card>
    );
}
