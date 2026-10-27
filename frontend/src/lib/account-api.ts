import {
    ChangePasswordInput,
    UpdateProfileInput,
    UserProfile,
} from '@/types/account';

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

export async function fetchProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr_demo_123',
        },
        cache: 'no-store',
    });
    return handleResponse<UserProfile>(res);
}

export async function updateProfile(
    input: UpdateProfileInput,
): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/account/profile`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr_demo_123',
        },
        body: JSON.stringify(input),
    });
    return handleResponse<UserProfile>(res);
}

export async function changePassword(
    input: ChangePasswordInput,
): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/account/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr_demo_123',
        },
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
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr_demo_123',
        },
    });
    return handleResponse<{
        success: boolean;
        message: string;
        tokenVersion: number;
    }>(res);
}
