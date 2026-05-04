// src/pages/projects/ProjectTablePage.tsx
"use client";

import { ProjectsTableHeader, ProjectsTable } from "@/modules/projects";

export default function ProjectTablePage() {
    return (
        <div className="container mx-auto min-w-0 max-w-full py-6 px-3 sm:py-8 sm:px-5 lg:px-8">
            <ProjectsTableHeader />

            <div className="mt-8 bg-card border rounded-xl shadow-sm overflow-hidden">
                <ProjectsTable />

                {/*<div className="border-t px-6 py-4">*/}
                {/*    <ProjectsTablePagination />*/}
                {/*</div>*/}
            </div>
        </div>
    );
}
