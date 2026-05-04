import { UserRole } from "@/types/dto/enums/UserRole";

const CLAIMS = {
    nameId: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    email: "email",
    fullName: "fullName",
} as const;

type TokenPayload = Record<string, unknown>;

function decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = globalThis.atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function parsePayload(token: string): TokenPayload | null {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
        return JSON.parse(decodeBase64Url(parts[1])) as TokenPayload;
    } catch {
        return null;
    }
}

function getStringClaim(payload: TokenPayload, ...keys: string[]): string | null {
    for (const key of keys) {
        const value = payload[key];
        if (typeof value === "string" && value.trim().length > 0) return value;
    }
    return null;
}

function getRoleClaim(payload: TokenPayload): UserRole | null {
    const raw =
        payload.role ??
        payload[CLAIMS.role];

    const value =
        typeof raw === "string"
            ? raw
            : Array.isArray(raw) && typeof raw[0] === "string"
                ? raw[0]
                : null;

    if (!value) return null;
    return Object.values(UserRole).includes(value as UserRole) ? (value as UserRole) : null;
}

export type AccessTokenClaims = {
    userId: string | null;
    role: UserRole | null;
    email: string | null;
    fullName: string | null;
    departmentId: string | null;
};

export function parseAccessTokenClaims(token: string): AccessTokenClaims | null {
    const payload = parsePayload(token);
    if (!payload) return null;

    return {
        userId: getStringClaim(payload, "nameid", CLAIMS.nameId),
        role: getRoleClaim(payload),
        email: getStringClaim(payload, CLAIMS.email),
        fullName: getStringClaim(payload, CLAIMS.fullName),
        departmentId: getStringClaim(payload, "departmentId"),
    };
}

