import { api } from "@/shared/lib";

export type AnalyticsDashboard = {
    openTasks: number;
    overdueTasks: number;
    tasksByStatus: Array<{ statusName: string; count: number }>;
    topAssignees: Array<{ userId: string; fullName: string; activeTaskCount: number }>;
};

export const analyticsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAnalyticsDashboard: builder.query<
            AnalyticsDashboard,
            { projectId?: string | null } | void
        >({
            query: (arg) => {
                const pid =
                    arg && typeof arg === "object" && arg.projectId ? String(arg.projectId) : undefined;
                return {
                    url: "/analytics/dashboard",
                    method: "GET",
                    params: pid ? { projectId: pid } : undefined,
                };
            },
        }),
    }),
    overrideExisting: false,
});

export const { useGetAnalyticsDashboardQuery } = analyticsApi;
