import { axiosInstance } from "@/shared/lib/api/baseQuery";

export function getFileDownloadPath(fileId: string): string {
    return `/files/${encodeURIComponent(fileId)}`;
}

export function getUserAvatarFileId(userId: string): string {
    return `av:${userId}`;
}

export async function fetchFileBlob(fileId: string): Promise<Blob> {
    const response = await axiosInstance.get(getFileDownloadPath(fileId), { responseType: "blob" });
    return response.data as Blob;
}


