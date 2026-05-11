/** Разбор ProblemDetails / ValidationProblemDetails (ASP.NET Core) и ошибок RTK Query / Axios */

import type { AxiosError } from "axios";

type ProblemBody = {
    title?: string;
    detail?: string;
    message?: string;
    errors?: Record<string, string[]>;
};

export type ApiErrorMessageOptions = {
    /** Устарело: сообщение с сервера имеет приоритет; опция зарезервирована для совместимости */
    authContext?: boolean;
};

function isAxiosLike(e: unknown): e is AxiosError<unknown> {
    return typeof e === "object" && e !== null && "isAxiosError" in e && (e as { isAxiosError?: boolean }).isAxiosError === true;
}

function extractStatusAndData(error: unknown): { status?: number; data?: unknown } {
    if (typeof error !== "object" || error === null) return {};

    if (isAxiosLike(error)) {
        return { status: error.response?.status, data: error.response?.data };
    }

    const e = error as Record<string, unknown>;
    if (typeof e.status === "number") {
        return { status: e.status, data: e.data };
    }
    const nested = e.error;
    if (typeof nested === "object" && nested !== null) {
        const n = nested as Record<string, unknown>;
        if (typeof n.status === "number") {
            return { status: n.status, data: n.data };
        }
    }
    return {};
}

function pickFromProblemBody(data: unknown): string | null {
    if (typeof data === "string") {
        const t = data.trim();
        return t.length ? t : null;
    }
    if (typeof data !== "object" || data === null) return null;
    const d = data as ProblemBody;
    if (typeof d.detail === "string" && d.detail.trim()) return d.detail.trim();
    if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
    if (d.errors && typeof d.errors === "object") {
        const firstKey = Object.keys(d.errors)[0];
        const msgs = firstKey ? d.errors[firstKey] : undefined;
        if (msgs?.length) return msgs[0]!;
    }
    if (typeof d.title === "string" && d.title.trim()) {
        const low = d.title.toLowerCase();
        if (!low.includes("validation") && !low.includes("one or more")) return d.title.trim();
    }
    return null;
}

export function getApiErrorMessage(error: unknown, options?: ApiErrorMessageOptions): string {
    void options;
    const { status, data } = extractStatusAndData(error);

    const fromBody = pickFromProblemBody(data);
    if (fromBody) return fromBody;

    if (status === 401) return "Сессия истекла. Войдите снова";
    if (status === 403) return "Недостаточно прав";
    if (status === 404) return "Не найдено";
    if (status === 409) return "Конфликт данных";

    if (typeof error === "object" && error !== null && "message" in error) {
        const m = (error as { message?: string }).message;
        if (typeof m === "string" && m && m !== "Rejected") return m;
    }

    return "Произошла ошибка";
}

export function getApiValidationErrors(error: unknown): Record<string, string> | null {
    if (typeof error !== "object" || error === null) return null;
    const { data } = extractStatusAndData(error);
    if (typeof data !== "object" || data === null) return null;
    const errors = (data as ProblemBody).errors;
    if (!errors) return null;
    const flat: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(errors)) {
        if (msgs?.[0]) flat[key] = msgs[0]!;
    }
    return Object.keys(flat).length ? flat : null;
}
