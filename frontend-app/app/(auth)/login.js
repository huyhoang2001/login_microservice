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
import { authAPI } from '../../src/api/auth';
import FloatingLabelInput from '../../src/components/ui/FloatingLabelInput';
import SliderCaptcha from '../../src/components/auth/SliderCaptcha';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [processingLogin, setProcessingLogin] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
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

  // Clear error when user starts typing
  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
  };

  // Email validation function - English only
  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return { isValid: false, message: 'Vui lòng nhập địa chỉ email' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Định dạng email không hợp lệ' };
    }

    const localPart = email.trim().split('@')[0];
    const latinOnlyRegex = /^[a-zA-Z0-9._+-]+$/;
    if (!latinOnlyRegex.test(localPart)) {
      return { 
        isValid: false, 
        message: 'Email chỉ được chứa chữ cái tiếng Anh, số và các ký tự đặc biệt (. _ + -) trước dấu @' 
      };
    }

    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'live.com', 'icloud.com', 'protonmail.com', 'yandex.com',
      'aol.com', 'mail.com', 'zoho.com', 'fastmail.com'
    ];
    
    const emailLower = email.trim().toLowerCase();
    const domain = emailLower.split('@')[1];
    
    if (!commonDomains.includes(domain)) {
      return { 
        isValid: false, 
        message: 'Email phải sử dụng nhà cung cấp phổ biến (Gmail, Yahoo, Hotmail, Outlook, v.v.)' 
      };
    }

    return { isValid: true, message: '' };
  };

  // Enhanced password validation function - Multi-language support
  const validatePassword = (password) => {
    if (!password) {
      return { isValid: false, message: 'Vui lòng nhập mật khẩu' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    if (password.length > 20) {
      return { isValid: false, message: 'Mật khẩu không được vượt quá 20 ký tự' };
    }

    const hasLetter = /\p{L}/u.test(password);
    if (!hasLetter) {
      return { isValid: false, message: 'Mật khẩu phải chứa ít nhất một chữ cái (bất kỳ ngôn ngữ nào)' };
    }

    return { isValid: true, message: '' };
  };

  // Handle email input to ensure only Latin characters
  const handleEmailChange = (text) => {
    clearErrors();
    const cleanedText = text.toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
    setEmail(cleanedText);
    emailRef.current = cleanedText;
    
    // Light real-time validation
    if (cleanedText && cleanedText.includes('@') && cleanedText.includes('.')) {
      const validation = validateEmail(cleanedText);
      if (!validation.isValid) {
        setEmailError(validation.message);
      }
    }
  };

  // Handle password change with basic validation
  const handlePasswordChange = (text) => {
    clearErrors();
    setPassword(text);
    passwordRef.current = text;
    
    // Light real-time validation
    if (text && text.length > 0 && text.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
    }
  };

  const handleLoginPress = async () => {
    const currentEmail = emailRef.current || email;
    const currentPassword = passwordRef.current || password;

    console.log('🔍 Login button pressed, validating form...');

    let hasError = false;

    // Validate email
    const emailValidation = validateEmail(currentEmail);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      hasError = true;
    }

    // Validate password
    const passwordValidation = validatePassword(currentPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
      hasError = true;
    }

    if (hasError) {
      Alert.alert('Thông báo', 'Vui lòng sửa các lỗi trước khi đăng nhập');
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
    
    console.log('🔐 Starting login process...');

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
    
    try {
      const loginData = { 
        email: currentEmail.trim().toLowerCase(), 
        password: currentPassword
      };
      
      console.log('📤 Sending login request...');
      
      const result = await authAPI.login(loginData);
      
      console.log('✅ Login successful');
      
      // Clear form ONLY after successful login
      setEmail('');
      setPassword('');
      setCaptchaVerified(false);
      clearErrors();
      emailRef.current = '';
      passwordRef.current = '';
      
      console.log('🚀 Navigating to profile tab...');
      router.replace('/(tabs)/profile');
      
      // Show success after navigation
      setTimeout(() => {
        Alert.alert('🎉 Thành công', result.message || 'Đăng nhập thành công!');
      }, 500);
      
    } catch (error) {
      console.log('ℹ️ Login failed:', error.message);
      
      // Enhanced error handling
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error.message === 'Email không tồn tại') {
        errorMessage = 'Email này chưa được đăng ký. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.';
        setEmailError('Email không tồn tại');
      } else if (error.message === 'Mật khẩu không chính xác') {
        errorMessage = 'Mật khẩu không chính xác. Vui lòng thử lại.';
        setPasswordError('Mật khẩu không chính xác');
      } else if (error.message === 'Email hoặc mật khẩu không chính xác') {
        errorMessage = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        setEmailError('Thông tin đăng nhập không chính xác');
        setPasswordError('Thông tin đăng nhập không chính xác');
      } else if (error.userMessage) {
        errorMessage = error.userMessage;
      }
      
      Alert.alert('Đăng nhập thất bại', errorMessage);
      
      // Reset captcha verification on error but keep form data
      setCaptchaVerified(false);
    } finally {
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

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email || !email.trim()) {
      Alert.alert(
        'Quên mật khẩu', 
        'Vui lòng nhập email trước, sau đó nhấn "Quên mật khẩu?" để được hỗ trợ khôi phục.'
      );
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Email không hợp lệ', emailValidation.message);
      return;
    }

    Alert.alert(
      'Quên mật khẩu', 
      `Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến email: ${email}
(Tính năng này sẽ được phát triển trong tương lai)`
    );
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
              <Text style={styles.subtitle}>Chào mừng bạn trở lại</Text>
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
                label="Địa chỉ Email (tiếng Anh)"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="example@gmail.com"
                editable={!isButtonDisabled}
                returnKeyType="next"
                errorMessage={emailError}
                showCharacterCount={false}
              />
              
              <FloatingLabelInput
                label="Mật khẩu (6-20 ký tự, đa ngôn ngữ)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                maxLength={20}
                editable={!isButtonDisabled}
                returnKeyType="done"
                onSubmitEditing={handleLoginPress}
                placeholder="password123 / mậtkhẩu123 / 密码123"
                errorMessage={passwordError}
                showCharacterCount={false}
              />
            </View>
            
            {/* <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={isButtonDisabled}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity> */}
            
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
    marginBottom: 32,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  connectionText: {
    marginLeft: 8,
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
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