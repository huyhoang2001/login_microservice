import { Platform } from 'react-native';

// Trong networkTest.js
const API_URLS = {
  localhost: 'http://localhost:3001/api',
  androidEmulator: 'http://10.0.2.2:3001/api',
  ip127: 'http://127.0.0.1:3001/api',
  realIP: 'http://192.168.100.219:3001/api', // Thay IP thật của bạn
};

export const testAllConnections = async () => {
  console.log('🧪 Testing all network connections...');
  console.log('Platform:', Platform.OS);
  
  const results = {};
  
  for (const [name, url] of Object.entries(API_URLS)) {
    try {
      console.log(`Testing ${name}: ${url}`);
      
      // Simple fetch test with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        results[name] = { success: true, status: response.status, data };
        console.log(`✅ ${name} SUCCESS:`, data.status);
      } else {
        results[name] = { success: false, status: response.status, error: 'HTTP Error' };
        console.log(`❌ ${name} HTTP ERROR:`, response.status);
      }
      
    } catch (error) {
      results[name] = { success: false, error: error.message };
      console.log(`❌ ${name} ERROR:`, error.message);
    }
  }
  
  return results;
};

export const getWorkingApiUrl = async () => {
  const results = await testAllConnections();
  
  // Find first working URL
  for (const [name, result] of Object.entries(results)) {
    if (result.success) {
      const url = API_URLS[name];
      console.log(`🎯 Using working API URL: ${url}`);
      return url;
    }
  }
  
  // Fallback based on platform
  const fallback = Platform.OS === 'android' ? API_URLS.androidEmulator : API_URLS.localhost;
  console.log(`⚠️ No working URL found, using fallback: ${fallback}`);
  return fallback;
};