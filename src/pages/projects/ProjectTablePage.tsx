// src/pages/projects/ProjectTablePage.tsx
"use client";

import {
    ProjectsTableHeader,
    ProjectsTable,
    ProjectsTablePagination,
} from "@/modules/projects";

export default function ProjectTablePage() {
    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
