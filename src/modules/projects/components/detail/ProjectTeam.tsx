import {Card, CardContent, CardHeader, CardTitle} from "@/shared/ui_shadcn/card";
import {Separator} from "@/shared/ui_shadcn/separator";
import {ProjectDetailedDto} from "@/types/dto/projects/ProjectDetailedDto";
import {UserAvatar} from "@/shared/ui/UserAvatar";

interface Props {
    project: ProjectDetailedDto;
}

export function ProjectTeam({project}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Команда</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3 mb-6">
                    <UserAvatar
                        userId={project.owner.id}
                        name={project.owner.name}
                        hasAvatar={project.owner.hasAvatar === true}
                        size="lg"
                        className="h-12 w-12"
                    />
                    <div>
                        <p className="font-medium">{project.owner.name}</p>
                        <p className="text-sm text-muted-foreground">Владелец проекта</p>
                    </div>
                </div>

                {project.members?.length > 0 && (
                    <>
                        <Separator className="my-4"/>
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Участники ({project.members.length})</p>
                            <div className="flex -space-x-2">
                                {project.members.slice(0, 5).map((member) => (
                                    <UserAvatar
                                        userId={member.id}
                                        name={member.name}
                                        hasAvatar={member.hasAvatar === true}
                                        size="sm"
                                        className="h-8 w-8 border-2 border-background"
                                    />
                                ))}
                                {project.members.length > 5 && (
                                    <div
                                        className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                        +{project.members.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
