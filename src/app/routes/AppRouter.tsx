import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignalRBridge } from "@/app/providers/SignalRBridge";
import { AppRoutes } from "./AppRoutes";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { UserRole } from "@/types/dto/enums/UserRole";
import AppLayout from "@/widgets/layouts/AppLayout";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import LoginPage from "@/pages/login/LoginPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import ProjectCommentsPage from "@/pages/projects/ProjectCommentsPage";
import ProjectCreatePage from "@/pages/projects/ProjectCreatePage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import ProjectEditPage from "@/pages/projects/ProjectEditPage";
import ProjectHistoryPage from "@/pages/projects/ProjectHistoryPage";
import ProjectTablePage from "@/pages/projects/ProjectTablePage";
import ProjectTasksTablePage from "@/pages/projects/ProjectTasksTablePage";
import RegisterPage from "@/pages/register/RegisterPage";
import TaskCreatePage from "@/pages/tasks/TaskCreatePage";
import TaskDashBoardPage from "@/pages/tasks/TaskDashBoardPage";
import TaskEditPage from "@/pages/tasks/TaskEditPage";

const KnowledgePage = lazy(() => import("@/pages/knowledge/KnowledgePage"));
const TaskDetailPage = lazy(() => import("@/pages/tasks/TaskDetailPage"));
const AdminPage = lazy(() => import("@/pages/admin/AdminPage"));
const AnalyticsPage = lazy(() => import("@/pages/analytics/AnalyticsPage"));
const routeFallback = (
    <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">Загрузка…</div>
);

export const AppRouter = () => (
    <BrowserRouter>
        <SignalRBridge />
        <Suspense fallback={routeFallback}>
            <Routes>
                <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
                <Route path={AppRoutes.REGISTER} element={<RegisterPage />} />
                <Route path={AppRoutes.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={AppRoutes.RESET_PASSWORD} element={<ResetPasswordPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path={AppRoutes.PROJECTS} element={<ProjectTablePage />} />
                        <Route path={AppRoutes.PROJECT_CREATE} element={<ProjectCreatePage />} />

                        <Route path={`${AppRoutes.PROJECTS}/:projectId`}>
                            <Route index element={<ProjectDetailPage />} />
                            <Route path="table" element={<ProjectTasksTablePage />} />
                            <Route path="edit" element={<ProjectEditPage />} />
                            <Route path="comments" element={<ProjectCommentsPage />} />
                            <Route path="history" element={<ProjectHistoryPage />} />
                        </Route>

                        <Route path={`${AppRoutes.TASKS}/:projectId`}>
                            <Route index element={<TaskDashBoardPage />} />
                            <Route path="create" element={<TaskCreatePage />} />
                            <Route path="detail/:taskId" element={<TaskDetailPage />} />
                            <Route path="edit/:taskId" element={<TaskEditPage />} />
                        </Route>

                        <Route path={AppRoutes.KNOWLEDGE} element={<KnowledgePage />} />
                        <Route path={AppRoutes.KNOWLEDGE_ARTICLE} element={<KnowledgePage />} />
                        <Route path={AppRoutes.SEARCH} element={<Navigate to={AppRoutes.PROJECTS} replace />} />
                        <Route path={AppRoutes.ANALYTICS} element={<AnalyticsPage />} />
                        <Route path={AppRoutes.PROFILE} element={<ProfilePage />} />
                        <Route element={<RoleRoute role={UserRole.Admin} />}>
                            <Route path={AppRoutes.ADMIN} element={<AdminPage />} />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to={AppRoutes.PROJECTS} replace />} />
            </Routes>
        </Suspense>
    </BrowserRouter>
);
