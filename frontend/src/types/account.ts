export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    theme?: string;
    locale?: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    scheduledPermanentDeletionAt?: string | null;
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

export interface DeleteAccountInput {
    password: string;
}

export interface DeleteAccountResponse {
    success: boolean;
    message: string;
    scheduledPermanentDeletionAt: string;
    gracePeriodDays: number;
}

export interface ApiResponse<T = unknown> {
    success?: boolean;
    message?: string;
    data?: T;
    statusCode?: number;
}
