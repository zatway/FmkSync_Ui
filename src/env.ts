import type { Env } from "./vite-env";

/** Единая точка конфигурации URL: API-сегменты и пути SPA. */
export const env: Env = {
    VITE_API_BASE_URL: "http://localhost:5237/api/v1",
    VITE_API_BASE_URL_SIGNALR_HUB: "/hubs/notifications",

    API_AUTH_PATH: "/auth",
    API_PROJECTS_PATH: "/projects",
    API_TASK_PATH: "/Task",
    API_TASK_COMMENTS_PATH: "/taskComments",
    API_ADMIN_PATH: "/admin",
    API_PROFILE_PATH: "/profile",

    PROJECT_TASK_STATUS_COLUMNS_SUFFIX: "/task-status-columns",
    PROJECTS_HISTORY_SUFFIX: "/history",
    PROJECTS_COMMENTS_SUFFIX: "/comments",
    PROJECT_COMMENT_BY_ID_PREFIX: "/comments",

    PROFILE_ME_SUFFIX: "/me",
    PROFILE_ME_AVATAR_SUFFIX: "/me/avatar",
    PROFILE_UPDATE_SUFFIX: "/update-profile",

    API_DEPARTMENTS_PATH: "/departments",
    API_POSITIONS_PATH: "/positions",

    ROUTE_LOGIN: "/login",
    ROUTE_REGISTER: "/register",
    ROUTE_PROJECTS: "/projects",
    ROUTE_PROJECT_CREATE: "/projects/create",
    ROUTE_TASKS: "/tasks",
    ROUTE_KNOWLEDGE: "/knowledge",
    ROUTE_KNOWLEDGE_ARTICLE: "/knowledge/:slug",
    ROUTE_SEARCH: "/search",
    ROUTE_ANALYTICS: "/analytics",
    ROUTE_FORGOT_PASSWORD: "/forgot-password",
    ROUTE_RESET_PASSWORD: "/reset-password",
    ROUTE_ADMIN: "/admin",
    ROUTE_PROFILE: "/profile",

    AUTH_REGISTER_REL: "/register",
    AUTH_LOGIN_REL: "/login",
    AUTH_LOGOUT_REL: "/logout",
    AUTH_REFRESH_REL: "/refresh",
};

const LOCAL_API_ORIGIN_DEFAULT = "http://localhost:5237";

function isLocalHost(hostname: string): boolean {
    return hostname === "localhost" || hostname === "127.0.0.1";
}

function getApiOrigin(): string {
    const currentOrigin = globalThis.location.origin;
    const currentHost = globalThis.location.hostname;

    if (!isLocalHost(currentHost)) {
        return currentOrigin;
    }

    return LOCAL_API_ORIGIN_DEFAULT;
}

export const apiOrigin = getApiOrigin();
env.VITE_API_BASE_URL = apiOrigin;

/** Полный URL хаба SignalR (вне префикса `/api/v1`). */
export function getSignalRNotificationsHubUrl(): string {
    try {
        const api = new URL(env.VITE_API_BASE_URL);
        const origin = `${api.protocol}//${api.host}`;
        return `${origin}${env.VITE_API_BASE_URL_SIGNALR_HUB}`;
    } catch {
        return `${globalThis.location.origin}${env.VITE_API_BASE_URL_SIGNALR_HUB}`;
    }
}
