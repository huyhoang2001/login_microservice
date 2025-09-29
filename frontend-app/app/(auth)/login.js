//frontend-app/app/(auth)/login.js
import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { authAPI } from '../../lib/api/auth';
import FloatingLabelInput from '../../lib/components/FloatingLabelInput';
import SliderCaptcha from '../../lib/components/SliderCaptcha';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [processingLogin, setProcessingLogin] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Refs to store current form values (prevent race conditions)
  const emailRef = useRef('');
  const passwordRef = useRef('');

  // Update refs when state changes
  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  // Initialize authAPI when component mounts
  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    try {
      console.log('🚀 Initializing API...');
      const baseUrl = await authAPI.initialize();
      console.log('✅ API initialized with URL:', baseUrl);
      setApiBaseUrl(baseUrl);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize API:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối server. Vui lòng thử lại.',
        [{ text: 'Thử lại', onPress: initializeAPI }]
      );
    }
  };

  const handleLoginPress = async () => {
    const currentEmail = emailRef.current || email;
    const currentPassword = passwordRef.current || password;

    console.log('🔍 Login button pressed, checking form data:', {
      email: currentEmail || 'EMPTY',
      password: currentPassword ? 'HAS_PASSWORD' : 'NO_PASSWORD',
      emailLength: currentEmail?.length || 0,
      passwordLength: currentPassword?.length || 0
    });

    // Validate inputs first
    if (!currentEmail?.trim() || !currentPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!currentEmail.includes('@')) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    // Check if API is initialized
    if (!isInitialized || !apiBaseUrl) {
      Alert.alert('Lỗi', 'Đang kết nối server, vui lòng thử lại sau');
      initializeAPI();
      return;
    }

    // Show captcha for verification
    console.log('🔒 Showing captcha for verification...');
    setShowCaptcha(true);
    setCaptchaVerified(false);
  };

  const handleCaptchaSuccess = async (captchaData) => {
    console.log('✅ Captcha verified successfully');
    
    // Debug: check form state before closing modal
    const currentEmail = emailRef.current || email;
    const currentPassword = passwordRef.current || password;
    
    console.log('🔍 Form state before closing captcha:', {
      email: currentEmail || 'EMPTY',
      password: currentPassword ? 'HAS_PASSWORD' : 'NO_PASSWORD',
      emailLength: currentEmail?.length || 0,
      passwordLength: currentPassword?.length || 0
    });
    
    setShowCaptcha(false);
    setCaptchaVerified(true);
    
    // Small delay to ensure modal state is settled
    setTimeout(() => {
      performLogin();
    }, 200);
  };

  const performLogin = async () => {
    // Use refs to get most current values
    const currentEmail = emailRef.current || email;
    const currentPassword = passwordRef.current || password;
    
    // Debug: check form state when actually calling login
    console.log('🔍 Form state at login execution:', {
      email: currentEmail || 'EMPTY',
      password: currentPassword ? 'HAS_PASSWORD' : 'NO_PASSWORD',
      emailTrimmed: currentEmail?.trim() || 'EMPTY',
      emailLength: currentEmail?.length || 0,
      passwordLength: currentPassword?.length || 0
    });

    // Final validation with current values
    if (!currentEmail?.trim()) {
      console.error('❌ Email is empty at login time');
      Alert.alert('Lỗi', 'Email bị thiếu. Vui lòng nhập lại.');
      setShowCaptcha(false);
      setCaptchaVerified(false);
      return;
    }

    if (!currentPassword) {
      console.error('❌ Password is empty at login time');
      Alert.alert('Lỗi', 'Mật khẩu bị thiếu. Vui lòng nhập lại.');
      setShowCaptcha(false);
      setCaptchaVerified(false);
      return;
    }

    setLoading(true);
    setProcessingLogin(true);
    console.log('🔐 Starting login process...');
    
    try {
      const loginData = { 
        email: currentEmail.trim().toLowerCase(), 
        password: currentPassword
      };
      
      console.log('📤 Sending login request with data:', {
        email: loginData.email,
        hasPassword: !!loginData.password,
        passwordLength: loginData.password?.length || 0
      });
      
      const result = await authAPI.login(loginData);
      
      console.log('✅ Login successful:', {
        message: result.message,
        userId: result.user?.id,
        hasToken: !!result.token
      });
      
      // Clear form ONLY after successful login
      setEmail('');
      setPassword('');
      setCaptchaVerified(false);
      emailRef.current = '';
      passwordRef.current = '';
      
      console.log('🚀 Navigating to profile tab...');
      router.replace('/(tabs)/profile');
      
      // Show success after navigation
      setTimeout(() => {
        Alert.alert('🎉 Thành công', result.message || 'Đăng nhập thành công!');
      }, 500);
      
    } 
    catch (error) {
  // Chỉ log bình thường, không console.error để tránh red error
  console.log('ℹ️ Login attempt failed:', error.message);
  
  // Enhanced error handling - user friendly
  let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
  
  if (error.message === 'Thiếu email hoặc mật khẩu') {
    errorMessage = 'Thông tin đăng nhập bị thiếu. Vui lòng nhập lại.';
  } else if (error.message === 'Tài khoản không tồn tại') {
    errorMessage = 'Email chưa được đăng ký. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.';
  } else if (error.message === 'Sai mật khẩu') {
    errorMessage = 'Mật khẩu không đúng. Vui lòng thử lại.';
  } else if (error.userMessage) {
    errorMessage = error.userMessage;
  }
  
  // Gentle alert - không dùng ❌ icon
  Alert.alert('Thông báo', errorMessage, [
    { text: 'OK', onPress: () => {} }
  ]);
  
  // Reset captcha verification on error but keep form data
  setCaptchaVerified(false);
} 
    finally {
      setLoading(false);
      setProcessingLogin(false);
    }
  };

  const handleCaptchaClose = () => {
    console.log('❌ Captcha closed without verification');
    setShowCaptcha(false);
    setCaptchaVerified(false);
    // DON'T clear email/password when closing captcha
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    emailRef.current = text;
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    passwordRef.current = text;
  };

  // Check if button should be disabled
  const isButtonDisabled = loading || processingLogin || showCaptcha || !isInitialized;

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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Đăng Nhập</Text>
              <Text style={styles.subtitle}>Chào mừng bạn quay lại!</Text>
            </View>
            
            {/* Show connection status */}
            {!isInitialized && (
              <View style={styles.connectionStatus}>
                <ActivityIndicator size="small" color="#f59e0b" />
                <Text style={styles.connectionText}>Đang kết nối server...</Text>
              </View>
            )}
            
            <View style={styles.inputSection}>
              <FloatingLabelInput
                label="Địa chỉ Email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isButtonDisabled}
                returnKeyType="next"
              />
              
              <FloatingLabelInput
                label="Mật khẩu"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                editable={!isButtonDisabled}
                returnKeyType="done"
                onSubmitEditing={handleLoginPress}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.loginButton, 
                isButtonDisabled && styles.buttonDisabled
              ]}
              onPress={handleLoginPress}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              {processingLogin ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Đang xử lý...</Text>
                </View>
              ) : !isInitialized ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Đang kết nối...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>
                  {showCaptcha ? 'Đang xác thực...' : 'Đăng Nhập'}
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity 
                style={styles.signupButton}
                disabled={isButtonDisabled}
              >
                <Text style={styles.signupButtonText}>
                  Chưa có tài khoản? <Text style={styles.signupLink}>Đăng ký ngay</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Slider Captcha Modal - Only render if API is ready */}
      {apiBaseUrl && (
        <SliderCaptcha
          visible={showCaptcha}
          onSuccess={handleCaptchaSuccess}
          onClose={handleCaptchaClose}
          apiBase={apiBaseUrl}
        />
      )}
    </>
  );
}

// Giữ nguyên const styles = StyleSheet.create({...}) hiện có của bạn
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  connectionText: {
    marginLeft: 8,
    color: '#92400e',
    fontSize: 14,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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