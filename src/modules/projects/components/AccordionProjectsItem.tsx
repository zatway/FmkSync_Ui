import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui_shadcn/accordion";
import { FolderKanban, GitPullRequestCreate } from "lucide-react";
import { useGetProjectsQuery } from "@/modules/projects/api/projectsApi";
import { FC, useEffect, useMemo, useState } from "react";
import { AppRoutes } from "@/app/routes/AppRoutes";
import ProjectItem from "@/modules/projects/components/ProjectItem";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui_shadcn/dropdown-menu";
import type { ProjectBriefDto } from "@/types/dto/projects/ProjectBriefDto";

interface AccordionProjectsItemProps {
    collapsed: boolean;
    onNavigate?: () => void;
}

function ProjectsMenuBody({
    projects,
    onNavigate,
}: {
    projects: ProjectBriefDto[] | undefined;
    onNavigate?: () => void;
}) {
    return (
        <>
            <div className="mb-2 space-y-1">
                <NavLink
                    to={AppRoutes.PROJECT_CREATE}
                    onClick={onNavigate}
                    title="Создать проект"
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent/70",
                            isActive && "bg-accent/80",
                        )
                    }
                >
                    <GitPullRequestCreate size={14} />
                    Создать проект
                </NavLink>
            </div>
            <div className="space-y-1">
                {projects?.map((p) => (
                    <ProjectItem key={p.id} project={p} isCollapsed={false} onNavigate={onNavigate} />
                ))}
            </div>
        </>
    );
}

const AccordionProjectsItem: FC<AccordionProjectsItemProps> = ({ collapsed, onNavigate }) => {
    const { data: projects } = useGetProjectsQuery({}, { refetchOnMountOrArgChange: true });
    const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
    const location = useLocation();
    const isProjectsRoute = useMemo(
        () => location.pathname === AppRoutes.PROJECTS || location.pathname.startsWith(`${AppRoutes.PROJECTS}/`),
        [location.pathname],
    );

    useEffect(() => {
        console.log(projects?.length)
    }, [projects])

    const closeProjectsMenu = () => setProjectsMenuOpen(false);
    const handleItemNavigate = () => {
        onNavigate?.();
        closeProjectsMenu();
    };

    const collapsedTriggerClass = cn(
        "flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent",
        isProjectsRoute && "bg-accent text-accent-foreground",
    );

    if (collapsed) {
        return (
            <div className="w-full min-w-0">
                <DropdownMenu open={projectsMenuOpen} onOpenChange={setProjectsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={cn(collapsedTriggerClass, "w-full min-w-0 border-0 bg-transparent")}
                            aria-label="Проекты"
                        >
                            <FolderKanban size={20} className="min-w-[20px] shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="right"
                        align="start"
                        sideOffset={8}
                        className="z-[100] max-h-[min(80vh,28rem)] w-72 overflow-y-auto overflow-x-hidden p-2"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">Проекты</div>
                        <ProjectsMenuBody projects={projects} onNavigate={handleItemNavigate}/>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <AccordionItem value="Проекты" className="border-none min-w-0" id={projects?.length.toString()} key={projects?.length}>
            <AccordionTrigger
                className={cn(
                    "min-w-0 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent hover:no-underline",
                    isProjectsRoute && "bg-accent text-accent-foreground",
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FolderKanban size={20} className="min-w-[20px] shrink-0" />
                    <span className="truncate">Проекты</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="min-h-0 pb-1 pl-2 data-open:overflow-visible">
                <div className="max-h-[min(55vh,22rem)] overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5">
                    <ProjectsMenuBody projects={projects} onNavigate={onNavigate} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default AccordionProjectsItem;
