// frontend/src/api/auth.js

// Enhanced URL detection with better error handling
const getWorkingApiUrl = async () => {
  const configuredUrl = import.meta.env?.VITE_API_BASE_URL;
  const urls = [
    configuredUrl,
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean);


  // Test each URL
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);


      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return url;
      }
    } catch {
      // Try the next configured API URL.
    }
  }

  // Final fallback
  const fallbackUrl = 'http://localhost:3001/api';


  return fallbackUrl;
};

class AuthAPI {
  constructor() {
    this.baseURL = null;
    this.initialized = false;
    this.initializationPromise = null;
    this.timeout = 10000; // 10s timeout for images
  }

  async initialize() {
    if (this.initialized && this.baseURL) {
      return this.baseURL;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    try {
      this.initializationPromise = getWorkingApiUrl();
      this.baseURL = await this.initializationPromise;
      this.initialized = true;
      this.initializationPromise = null;
      return this.baseURL;
    } catch (error) {
      // Use fallback
      this.baseURL = 'http://localhost:3001/api';
      this.initialized = true;
      this.initializationPromise = null;
      return this.baseURL;
    }
  }

  async request(endpoint, options = {}) {
    // Ensure initialization
    if (!this.initialized || !this.baseURL) {
      await this.initialize();
    }

    const url = `${this.baseURL}${endpoint}`;

    // Get token
    const token = localStorage.getItem('token');

    const config = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    // Stringify body if needed
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // Request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        error.status = response.status;

        // User-friendly error messages
        const errorMessages = {
          400: errorData.error || 'Dữ liệu không hợp lệ',
          401: 'Email hoặc mật khẩu không đúng',
          403: 'Không có quyền truy cập',
          404: 'Không tìm thấy dịch vụ',
          500: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
          502: 'Không thể kết nối đến server',
          503: 'Server đang bảo trì',
        };

        error.userMessage = errorMessages[response.status] || 'Có lỗi xảy ra. Vui lòng thử lại.';
        throw error;
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.userMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
        throw timeoutError;
      }

      if (error.message === 'Network request failed') {
        error.userMessage = 'Không thể kết nối. Kiểm tra kết nối mạng và thử lại.';
      } else if (!error.userMessage) {
        error.userMessage = 'Có lỗi kết nối. Vui lòng thử lại.';
      }

      throw error;
    }
  }

  async signup(userData) {
    const data = await this.request('/signup', {
      method: 'POST',
      body: userData
    });

    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async login(credentials) {
    const data = await this.request('/login', {
      method: 'POST',
      body: credentials
    });

    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async logout() {
    const [serverLogout] = await Promise.allSettled([
      this.request('/logout', { method: 'POST' }),
      // Clear localStorage
      localStorage.removeItem('token'),
      localStorage.removeItem('user')
    ]);

    return true;
  }

  async getProfile() {
    return await this.request('/profile');
  }

  async getCaptchaSession() {
    return await this.request('/captcha/session');
  }

  async verifyCaptcha(payload) {
    return await this.request('/captcha/verify', {
      method: 'POST',
      body: payload
    });
  }

  async isLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      await this.request('/profile');
      return true;
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      // Assume logged in for network errors
      return true;
    }
  }

  // Get current config
  getConfig() {
    return {
      baseURL: this.baseURL,
      initialized: this.initialized,
      timeout: this.timeout
    };
  }

  // Force reinitialize (for debugging)
  async forceReinitialize() {
    this.initialized = false;
    this.baseURL = null;
    this.initializationPromise = null;
    return await this.initialize();
  }
}

export const authAPI = new AuthAPI();
