import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authAPI } from '../../lib/api/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('👤 Loading user profile...');
      
      // Get user from AsyncStorage first
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('✅ Profile loaded from storage:', userData.email);
      }

      // Try to get fresh data from API
      try {
        const profileData = await authAPI.getProfile();
        if (profileData?.user) {
          setUser(profileData.user);
          await AsyncStorage.setItem('user', JSON.stringify(profileData.user));
          console.log('✅ Profile refreshed from API');
        }
      } catch (apiError) {
        console.log('⚠️ API call failed, using cached data:', apiError.message);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      '🚪 Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 User confirmed logout, starting process...');
            
            try {
              // Show loading state
              Alert.alert('Đang xử lý...', 'Đang đăng xuất, vui lòng chờ...');
              
              // Perform logout
              await authAPI.logout();
              
              console.log('✅ Logout successful, navigating to login...');
              
              // Navigate to login with reset
              router.dismissAll?.(); // Dismiss any modals
              router.replace('/(auth)/login');
              
              // Confirm logout
              setTimeout(() => {
                Alert.alert('✅ Thành công', 'Đã đăng xuất thành công!');
              }, 100);
              
            } catch (error) {
              console.error('❌ Logout error:', error);
              
              Alert.alert(
                '⚠️ Thông báo',
                'Có lỗi khi đăng xuất nhưng bạn vẫn sẽ được đăng xuất.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Force logout anyway
                      router.replace('/(auth)/login');
                    }
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin user</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Thông tin cá nhân</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{user.id}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Họ tên:</Text>
          <Text style={styles.value}>{user.fullName}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Ngày tạo:</Text>
          <Text style={styles.value}>
            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        
        {user.lastLogin && (
          <View style={styles.infoItem}>
            <Text style={styles.label}>Lần cuối đăng nhập:</Text>
            <Text style={styles.value}>
              {new Date(user.lastLogin).toLocaleString('vi-VN')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
          <Text style={styles.refreshButtonText}>🔄 Cập nhật thông tin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});