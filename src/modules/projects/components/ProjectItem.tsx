import { FC } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {ListTodo, MoreHorizontal, Users,} from "lucide-react";
import { ProjectBriefDto } from "@/types/dto/projects/ProjectBriefDto";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui_shadcn/dropdown-menu";
import { Button } from "@/shared/ui_shadcn/button";
import { AppRoutes } from "@/app/routes/AppRoutes";
import {cn} from "@/shared/lib/ui_shadcn/utils";

interface ProjectItemProps {
    project: ProjectBriefDto;
    isCollapsed?: boolean;
    onSelect?: (projectId: string) => void;
    onNavigate?: () => void;
}

const ProjectItem: FC<ProjectItemProps> = ({
                                               project,
                                               isCollapsed = false,
                                               onSelect,
                                               onNavigate,
                                           }) => {
    const location = useLocation();
    const projectPath = `${AppRoutes.PROJECTS}/${project.id}`;
    const isActive = location.pathname.startsWith(projectPath);

    const nameProject = `${project.icon} ${project.name}`

    return (
        <div className="relative group">
            <NavLink
                to={projectPath}
                onClick={() => {
                    onSelect?.(project.id)
                    onNavigate?.()
                }}
                className={({ isActive: linkActive }) =>
                    cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                        "hover:bg-accent/70",
                        (isActive || linkActive) && "bg-accent/80 font-medium",
                        isCollapsed && "justify-center px-2"
                    )
                }
            >
                {isCollapsed && (
                    <span className="text-base leading-none" aria-hidden="true">
                        {project.icon || "📁"}
                    </span>
                )}

                {!isCollapsed && (
                    <>
                        <span className="truncate flex-1" title={project.name}>{nameProject}</span>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {project.taskCount !== undefined && (
                                <span className="flex items-center gap-0.5">
                  <ListTodo size={12} /> {project.taskCount}
                </span>
                            )}
                            {project.memberCount !== undefined && project.memberCount > 0 && (
                                <span className="flex items-center gap-0.5">
                  <Users size={12} /> {project.memberCount}
                </span>
                            )}
                        </div>
                    </>
                )}

                {isCollapsed && (
                    <div className="absolute left-full ml-2 hidden group-hover:block z-50">
                        <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-sm whitespace-nowrap" title={project.name}>
                            {nameProject}
                        </div>
                    </div>
                )}
            </NavLink>

            {!isCollapsed && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal size={14} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                            <NavLink to={`${AppRoutes.TASKS}/${project.id}`} onClick={onNavigate}>Открыть доску</NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <NavLink to={`${projectPath}/table`} onClick={onNavigate}>Таблица задач</NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <NavLink to={`${projectPath}/edit`} onClick={onNavigate}>Настройки проекта</NavLink>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};

export default ProjectItem;
