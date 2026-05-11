import type { AxiosError } from "axios";
import { axiosInstance } from "@/shared/lib/api/baseQuery";

export function getFileDownloadPath(fileId: string): string {
    return `/files/${encodeURIComponent(fileId)}`;
}

export function getUserAvatarFileId(userId: string): string {
    return `av:${userId}`;
}

async function throwIfBlobIsJsonError(blob: Blob, status: number): Promise<void> {
    const ct = blob.type || "";
    if (ct.includes("json") || ct === "text/plain") {
        const text = await blob.text();
        try {
            const json = JSON.parse(text) as { detail?: string; title?: string };
            throw { status, data: json };
        } catch (e) {
            if (typeof e === "object" && e !== null && "status" in e) throw e;
            throw { status, data: { detail: text || `Ошибка ${status}` } };
        }
    }
}

export async function fetchFileBlob(fileId: string): Promise<Blob> {
    try {
        const response = await axiosInstance.get(getFileDownloadPath(fileId), { responseType: "blob" });
        return response.data as Blob;
    } catch (err) {
        const ax = err as AxiosError<Blob>;
        const data = ax.response?.data;
        const st = ax.response?.status;
        if (data instanceof Blob && typeof st === "number") {
            await throwIfBlobIsJsonError(data, st);
        }
        throw err;
    }
}


