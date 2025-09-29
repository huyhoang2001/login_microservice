import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check auth state on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking authentication state...');
      
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
        console.log('✅ User is authenticated:', JSON.parse(userData).email);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        console.log('❌ User is not authenticated');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
    console.log('🔍 Auth check completed');
  };

  const login = async (userData, token) => {
    try {
      console.log('🔐 Setting auth state for login...');
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      console.log('✅ Auth state set for user:', userData.email);
    } catch (error) {
      console.error('❌ Login auth state error:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Clearing auth state for logout...');
      await AsyncStorage.multiRemove(['token', 'user']);
      
      setIsAuthenticated(false);
      setUser(null);
      console.log('✅ Auth state cleared');
    } catch (error) {
      console.error('❌ Logout auth state error:', error);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};