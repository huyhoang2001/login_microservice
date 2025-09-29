//frontend-app\lib\api\auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get device IP for network requests
const getDeviceNetworkIPs = () => {
  const ips = [];
  
  // Common local network ranges
  const commonRanges = [
    '192.168.1.',
    '192.168.0.',
    '192.168.100.',
    '10.0.0.',
    '172.16.0.'
  ];
  
  // Add your known IPs here
  ips.push('192.168.100.219'); // Your fallback IP
  
  return ips;
};

// Enhanced URL detection with better error handling
const getWorkingApiUrl = async () => {
  const urls = [];
  
  // Platform specific URLs
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:3001/api'); // Android emulator
  } else if (Platform.OS === 'ios') {
    urls.push('http://localhost:3001/api'); // iOS simulator
  }
  
  // Add localhost as fallback
  urls.push('http://127.0.0.1:3001/api');
  
  // Add device network IPs
  const deviceIPs = getDeviceNetworkIPs();
  deviceIPs.forEach(ip => {
    urls.push(`http://${ip}:3001/api`);
  });

  console.log('🔍 Testing API URLs:', urls);

  // Test each URL
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      console.log(`🔗 Testing: ${url}`);
      
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
        const data = await response.json();
        console.log(`✅ API found at ${url}:`, data);
        return url;
      }
    } catch (error) {
      console.log(`❌ ${url} failed:`, error.message);
    }
  }

  // Final fallback
  const fallbackUrl = Platform.OS === 'android' 
    ? 'http://10.0.2.2:3001/api' 
    : 'http://localhost:3001/api';
    
  console.warn(`⚠️ No working API found, using fallback: ${fallbackUrl}`);
  console.warn('💡 Make sure your backend is running on port 3001');
  console.warn('💡 If using device, update IP in auth.js');
  
  return fallbackUrl;
};

class AuthAPI {
  constructor() {
    this.baseURL = null;
    this.initialized = false;
    this.timeout = 10000; // 10s timeout for images
  }
// Thêm method mới trong class AuthAPI



// Giữ nguyên method login cũ để backward compatibility
  async initialize() {
    if (this.initialized && this.baseURL) {
      return this.baseURL;
    }
    
    try {
      console.log('🚀 Initializing AuthAPI...');
      this.baseURL = await getWorkingApiUrl();
      this.initialized = true;
      console.log('✅ AuthAPI initialized with:', this.baseURL);
      return this.baseURL;
    } catch (error) {
      console.error('❌ API initialization failed:', error);
      // Use platform-specific fallback
      this.baseURL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3001/api'
        : 'http://localhost:3001/api';
      this.initialized = true;
      return this.baseURL;
    }
  }

  async request(endpoint, options = {}) {
    // Ensure initialization
    if (!this.initialized || !this.baseURL) {
      await this.initialize();
    }

    const url = `${this.baseURL}${endpoint}`;
    console.log(`📡 Request to: ${url}`);
    
    // Get token
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
      console.log(`📡 Response status: ${response.status}`);

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
        console.error('🔌 Network error - Backend may not be running');
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
    
    if (data.token && data.user) {
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user', JSON.stringify(data.user))
      ]);
    }
    
    return data;
  }

  async logout() {
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
      if (error.status === 401) {
        AsyncStorage.multiRemove(['token', 'user']);
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
    return await this.initialize();
  }
}

export const authAPI = new AuthAPI();