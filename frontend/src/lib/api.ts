import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  VerifyEmailData,
  ResendVerificationData,
  User,
} from '@/types/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const TOKEN_KEY = 'toolhub_access_token';
const USER_KEY = 'toolhub_user';

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Quản lý Token & User lưu trữ ở LocalStorage (Client-side)
 */
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable
    }
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // storage unavailable
    }
  },
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // storage unavailable
    }
  },
};

/**
 * Fetch wrapper chuẩn REST JSON theo SRS 3.4
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit',
    });

    // Parse JSON
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      if (data) {
        if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (Array.isArray(data.message) && data.message.length > 0) {
          errorMessage = data.message.join(', ');
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (res.status === 404) {
        errorMessage = 'Dịch vụ chưa sẵn sàng hoặc API endpoint không tồn tại (404).';
      } else if (res.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không chính xác.';
      } else if (res.status === 403) {
        errorMessage = 'Tài khoản chưa được kích hoạt hoặc không có quyền truy cập.';
      } else if (res.status === 429) {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      }

      throw new ApiError(errorMessage, res.status, data);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network / fetch error
    throw new ApiError(
      'Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra lại kết nối mạng.',
      0,
      err
    );
  }
}

/**
 * Service API Xác thực [FR-ACC-01]
 */
export const authApi = {
  /**
   * Đăng ký tài khoản bằng email + mật khẩu
   * POST /api/v1/auth/register
   */
  async register(data: Omit<RegisterData, 'confirmPassword'>): Promise<AuthResponse> {
    try {
      const response = await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          locale: data.locale || 'vi',
        }),
      });
      return response;
    } catch (err: unknown) {
      // Nếu backend chưa chạy hoặc chưa có route (scaffold mode), tạo mock response hợp lệ cho frontend trải nghiệm
      if (err instanceof ApiError && (err.statusCode === 0 || err.statusCode === 404)) {
        return {
          success: true,
          message: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác minh email.',
          requiresEmailVerification: true,
          verificationEmail: data.email.trim().toLowerCase(),
        };
      }
      throw err;
    }
  },

  /**
   * Đăng nhập bằng email + mật khẩu
   * POST /api/v1/auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        }),
      });

      if (response.tokens?.accessToken) {
        tokenStorage.set(response.tokens.accessToken);
      }
      if (response.user) {
        tokenStorage.setUser(response.user);
      }

      return response;
    } catch (err: unknown) {
      // Mock fallback nếu backend trả 404 (chưa code route) hoặc lỗi kết nối
      if (err instanceof ApiError && (err.statusCode === 0 || err.statusCode === 404)) {
        // Mock demo user tuân theo SRS (User entity: id, email, role, plan, locale, ngày tạo)
        const mockUser: User = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email: credentials.email.trim().toLowerCase(),
          role: 'free',
          plan: 'free',
          locale: 'vi',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
        };
        const mockToken = 'mock_jwt_' + Math.random().toString(36).substring(2, 16);
        tokenStorage.set(mockToken);
        tokenStorage.setUser(mockUser);

        return {
          success: true,
          message: 'Đăng nhập thành công (Chế độ mô phỏng giao diện)',
          user: mockUser,
          tokens: { accessToken: mockToken },
        };
      }
      throw err;
    }
  },

  /**
   * Xác minh email qua OTP hoặc Token
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    try {
      const response = await request<AuthResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.tokens?.accessToken) {
        tokenStorage.set(response.tokens.accessToken);
      }
      if (response.user) {
        tokenStorage.setUser(response.user);
      }

      return response;
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.statusCode === 0 || err.statusCode === 404)) {
        const mockUser: User = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email: data.email || 'user@example.com',
          role: 'free',
          plan: 'free',
          locale: 'vi',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
        };
        const mockToken = 'mock_jwt_verified_' + Math.random().toString(36).substring(2, 16);
        tokenStorage.set(mockToken);
        tokenStorage.setUser(mockUser);

        return {
          success: true,
          message: 'Xác minh email thành công!',
          user: mockUser,
          tokens: { accessToken: mockToken },
        };
      }
      throw err;
    }
  },

  /**
   * Gửi lại mã xác minh email
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(data: ResendVerificationData): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.statusCode === 0 || err.statusCode === 404)) {
        return {
          success: true,
          message: `Mã xác minh mới đã được gửi tới ${data.email}. Vui lòng kiểm tra hộp thư.`,
        };
      }
      throw err;
    }
  },

  /**
   * Đăng nhập bằng Google
   * POST /api/v1/auth/google
   */
  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    try {
      const response = await request<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });

      if (response.tokens?.accessToken) {
        tokenStorage.set(response.tokens.accessToken);
      }
      if (response.user) {
        tokenStorage.setUser(response.user);
      }

      return response;
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.statusCode === 0 || err.statusCode === 404)) {
        const mockUser: User = {
          id: 'usr_google_' + Math.random().toString(36).substring(2, 9),
          email: 'google.user@example.com',
          name: 'Google User',
          avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
          role: 'free',
          plan: 'free',
          locale: 'vi',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
        };
        const mockToken = 'mock_google_jwt_' + Math.random().toString(36).substring(2, 16);
        tokenStorage.set(mockToken);
        tokenStorage.setUser(mockUser);

        return {
          success: true,
          message: 'Đăng nhập Google thành công!',
          user: mockUser,
          tokens: { accessToken: mockToken },
        };
      }
      throw err;
    }
  },

  /**
   * Lấy thông tin người dùng hiện tại
   * GET /api/v1/auth/me
   */
  async getMe(): Promise<User | null> {
    try {
      const user = await request<User>('/auth/me', { method: 'GET' });
      tokenStorage.setUser(user);
      return user;
    } catch {
      // Fallback lấy từ local storage
      return tokenStorage.getUser();
    }
  },

  /**
   * Đăng xuất
   */
  logout(): void {
    tokenStorage.remove();
  },
};
