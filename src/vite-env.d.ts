export type Env = {
    VITE_API_BASE_URL_SIGNALR_HUB: string;
    VITE_API_BASE_URL: string;

    /** Сегменты API относительно `VITE_API_BASE_URL` (начинаются с `/`). */
    API_AUTH_PATH: string;
    API_PROJECTS_PATH: string;
    API_TASK_PATH: string;
    API_TASK_COMMENTS_PATH: string;
    API_ADMIN_PATH: string;
    API_PROFILE_PATH: string;

    API_DEPARTMENTS_PATH: string;
    API_POSITIONS_PATH: string;

    PROJECT_TASK_STATUS_COLUMNS_SUFFIX: string;
    PROJECTS_HISTORY_SUFFIX: string;
    PROJECTS_COMMENTS_SUFFIX: string;
    PROJECT_COMMENT_BY_ID_PREFIX: string;
    PROJECT_TAGS: string;

    PROFILE_ME_SUFFIX: string;
    PROFILE_ME_AVATAR_SUFFIX: string;
    PROFILE_UPDATE_SUFFIX: string;

    /** Маршруты SPA (без хоста). */
    ROUTE_LOGIN: string;
    ROUTE_REGISTER: string;
    ROUTE_PROJECTS: string;
    ROUTE_PROJECT_CREATE: string;
    ROUTE_TASKS: string;
    ROUTE_KNOWLEDGE: string;
    ROUTE_KNOWLEDGE_ARTICLE: string;
    ROUTE_SEARCH: string;
    ROUTE_ANALYTICS: string;
    ROUTE_FORGOT_PASSWORD: string;
    ROUTE_RESET_PASSWORD: string;
    ROUTE_ADMIN: string;
    ROUTE_PROFILE: string;

    AUTH_REGISTER_REL: string;
    AUTH_LOGIN_REL: string;
    AUTH_LOGOUT_REL: string;
    AUTH_REFRESH_REL: string;
};

export {};

declare global {
    interface Window {
        env: {
            VITE_SERVICES_HOST: string;
        };
    }
}
