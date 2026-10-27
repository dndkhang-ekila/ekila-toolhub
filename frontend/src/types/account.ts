export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileInput {
    name?: string;
    avatarUrl?: string;
    phone?: string;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface ApiResponse<T = unknown> {
    success?: boolean;
    message?: string;
    data?: T;
    statusCode?: number;
}
