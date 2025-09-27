import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { authAPI } from '../../lib/api/auth';
import FloatingLabelInput from '../../lib/components/FloatingLabelInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email?.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    console.log('🔐 Starting login process...');
    
    try {
      const result = await authAPI.login({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      console.log('✅ Login successful:', {
        message: result.message,
        userId: result.user?.id,
        hasToken: !!result.token
      });
      
      console.log('🚀 Navigating to profile tab...');
      router.replace('/(tabs)/profile');
      
      setTimeout(() => {
        Alert.alert('🎉 Thành công', result.message || 'Đăng nhập thành công!');
      }, 500);
      
    } catch (error) {
      // Simple error handling - no technical details
      const errorMessage = error.userMessage || 'Đăng nhập thất bại. Vui lòng thử lại.';
      Alert.alert('❌ Lỗi đăng nhập', errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Đăng Nhập</Text>
              <Text style={styles.subtitle}>Chào mừng bạn quay lại!</Text>
            </View>
            
            <View style={styles.inputSection}>
              <FloatingLabelInput
                label="Địa chỉ Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              
              <FloatingLabelInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity 
                style={styles.signupButton}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  Chưa có tài khoản? <Text style={styles.signupLink}>Đăng ký ngay</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  signupButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signupButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signupLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});