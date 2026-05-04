import {UserRole} from "@/types/dto/enums/UserRole";

export interface UserResponse {
    fullName: string;
    email: string;
    role: UserRole;
    departmentName: string;
    positionName: string;
    hasAvatar: boolean;
}
