import {
    ChangePasswordInput,
    UpdateProfileInput,
    UserProfile,
} from '@/types/account';
import { tokenStorage } from './api';

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(): Record<string, string> {
    const token = tokenStorage.get();
    const user = tokenStorage.getUser();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // TODO: Xóa fallback header x-user-id khi backend hoàn thiện JwtAuthGuard
    headers['x-user-id'] = user?.id || 'usr_demo_123';

    return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errorMsg = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Có lỗi xảy ra, vui lòng thử lại';
        throw new Error(errorMsg);
    }
    return data;
}

export async function fetchProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
    });
    return handleResponse<UserProfile>(res);
}

export async function updateProfile(
    input: UpdateProfileInput,
): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    return handleResponse<UserProfile>(res);
}

export async function changePassword(
    input: ChangePasswordInput,
): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/account/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
}

export async function logoutAllDevices(): Promise<{
    success: boolean;
    message: string;
    tokenVersion: number;
}> {
    const res = await fetch(`${API_BASE}/account/logout-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return handleResponse<{
        success: boolean;
        message: string;
        tokenVersion: number;
    }>(res);
}
