import {
    ChangePasswordInput,
    DeleteAccountInput,
    DeleteAccountResponse,
    UpdateProfileInput,
    UserProfile,
} from '@/types/account';
import { tokenStorage } from './api';

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(customUserId?: string): Record<string, string> {
    const token = tokenStorage.get();
    const currentUser = tokenStorage.getUser();
    const effectiveUserId = customUserId || currentUser?.id || 'usr_demo_123';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': effectiveUserId,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errorMsg =
            Array.isArray(data.message)
                ? data.message.join(', ')
                : data.message || 'Có lỗi xảy ra, vui lòng thử lại';
        throw new Error(errorMsg);
    }
    return data;
}

export async function fetchProfile(userId?: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'GET',
        headers: getAuthHeaders(userId),
        cache: 'no-store',
    });
    return handleResponse<UserProfile>(res);
}

export async function updateProfile(
    input: UpdateProfileInput,
    userId?: string,
): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(userId),
        body: JSON.stringify(input),
    });
    return handleResponse<UserProfile>(res);
}

export async function changePassword(
    input: ChangePasswordInput,
    userId?: string,
): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/account/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
        body: JSON.stringify(input),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
}

export async function logoutAllDevices(userId?: string): Promise<{
    success: boolean;
    message: string;
    tokenVersion: number;
}> {
    const res = await fetch(`${API_BASE}/account/logout-all`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
    });
    return handleResponse<{
        success: boolean;
        message: string;
        tokenVersion: number;
    }>(res);
}

/**
 * [FR-ACC-05] Gửi yêu cầu xoá tài khoản với thời hạn ân hạn 30 ngày
 */
export async function deleteAccount(
    input: DeleteAccountInput,
    userId?: string,
): Promise<DeleteAccountResponse> {
    const res = await fetch(`${API_BASE}/account/delete`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
        body: JSON.stringify(input),
    });
    return handleResponse<DeleteAccountResponse>(res);
}

/**
 * [FR-ACC-05] Huỷ yêu cầu xoá & Khôi phục tài khoản trong vòng 30 ngày
 */
export async function restoreAccount(userId?: string): Promise<{
    success: boolean;
    message: string;
}> {
    const res = await fetch(`${API_BASE}/account/restore`, {
        method: 'POST',
        headers: getAuthHeaders(userId),
    });
    return handleResponse<{
        success: boolean;
        message: string;
    }>(res);
}
