import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fast URL detection with shorter timeout
const getWorkingApiUrl = async () => {
  const urls = [  
    'http://10.0.0.100:3001/api',      
    Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api',
  ];

  // Test URLs in parallel for speed
  const testUrl = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500); // 0.5s timeout

    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response.ok ? url : null;
    } catch (error) {
      clearTimeout(timeoutId);
      return null;
    }
  };

  // Test all URLs in parallel
  const results = await Promise.allSettled(urls.map(testUrl));
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✅ Found API: ${result.value}`);
      return result.value;
    }
  }

  throw new Error('No server found');
};

class AuthAPI {
  constructor() {
    this.baseURL = null;
    this.initialized = false;
    this.timeout = 2500; // 2.5s timeout
    this.fallbackURL = 'http://192.168.100.219:3001/api';
  }

  async initialize() {
    if (this.initialized && this.baseURL) return;
    
    try {
      this.baseURL = await getWorkingApiUrl();
      this.initialized = true;
    } catch (error) {
      // Fast fallback
      this.baseURL = this.fallbackURL;
      this.initialized = true;
    }
  }

  async request(endpoint, options = {}) {
    // Fast init check
    if (!this.initialized) {
      await this.initialize();
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // Get token once
    const token = await AsyncStorage.getItem('token');
    
    const config = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    // Optimize JSON stringify
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // Fast timeout with AbortController
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
        
        // Fast error mapping
        const errorMessages = {
          400: errorData.error || 'Dữ liệu không hợp lệ',
          401: 'Email hoặc mật khẩu không đúng',
          403: 'Không có quyền truy cập',
          404: 'Không tìm thấy dịch vụ',
          500: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
          502: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
          503: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
          504: 'Server đang gặp sự cố. Vui lòng thử lại sau.'
        };
        
        error.userMessage = errorMessages[response.status] || 'Có lỗi xảy ra. Vui lòng thử lại.';
        throw error;
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Fast error handling
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.userMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
        throw timeoutError;
      }
      
      if (error.message.includes('Network request failed')) {
        error.userMessage = 'Không thể kết nối đến server. Vui lòng thử lại.';
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
    
    // Parallel storage operations
    if (data.token && data.user) {
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user', JSON.stringify(data.user))
      ]);
    }
    
    return data;
  }

  async login(credentials) {
    const data = await this.request('/login', {
      method: 'POST',
      body: credentials
    });
    
    // Parallel storage operations for speed
    if (data.token && data.user) {
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user', JSON.stringify(data.user))
      ]);
    }
    
    return data;
  }

  async logout() {
    // Parallel operations - don't wait for server
    const [serverLogout] = await Promise.allSettled([
      this.request('/logout', { method: 'POST' }),
      AsyncStorage.multiRemove(['token', 'user'])
    ]);
    
    return true;
  }

  async getProfile() {
    return await this.request('/profile');
  }

  async isLoggedIn() {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;

    try {
      await this.request('/profile');
      return true;
    } catch (error) {
      // Fast auth check
      if (error.status === 401) {
        AsyncStorage.multiRemove(['token', 'user']); // Don't wait
        return false;
      }
      return true; // Assume logged in for network errors
    }
  }

  // Quick config info
  getConfig() {
    return {
      baseURL: this.baseURL,
      initialized: this.initialized,
      timeout: this.timeout
    };
  }
}

export const authAPI = new AuthAPI();