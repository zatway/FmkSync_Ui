import { Skeleton } from "@/shared/ui_shadcn/skeleton";

export function ProjectDetailSkeleton() {
    return (
        <div className="container mx-auto min-w-0 max-w-full px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
