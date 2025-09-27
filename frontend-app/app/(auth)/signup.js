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

// ... imports
const handleSignup = async () => {
  if (!fullName?.trim() || !email?.trim() || !password) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    return;
  }

  if (password.length < 6) {
    Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
    return;
  }

  setLoading(true);
  console.log('📝 Starting signup process...');
  
  try {
    const result = await authAPI.signup({ 
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(), 
      password 
    });
    
    console.log('✅ Signup successful, result:', {
      message: result.message,
      hasToken: !!result.token,
      hasUser: !!result.user,
      userId: result.user?.id
    });
    
    // Navigate to profile immediately after successful signup
    console.log('🚀 Navigating to profile...');
    router.replace('/(tabs)/profile');
    
    // Show success message
    setTimeout(() => {
      Alert.alert('Thành công', result.message || 'Đăng ký thành công!');
    }, 500);
    
  } catch (error) {
    console.error('❌ Signup failed:', error);
    const errorMessage = error.userMessage || 
                        error.message || 
                        'Đăng ký thất bại. Vui lòng thử lại.';
    Alert.alert('Lỗi đăng ký', errorMessage);
  }
  
  setLoading(false);
};

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await authAPI.signup({ fullName, email, password });
      Alert.alert('Thành công', 'Tài khoản đã được tạo thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Đăng ký thất bại');
    }
    setLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
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
              <Text style={styles.title}>Đăng Ký</Text>
              <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu</Text>
            </View>
            
            <View style={styles.inputSection}>
              <FloatingLabelInput
                label="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              
              <FloatingLabelInput
                label="Địa chỉ Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <FloatingLabelInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              <FloatingLabelInput
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginButtonText}>
                  Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
  signupButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#059669',
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
  signupButtonText: {
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
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loginLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});