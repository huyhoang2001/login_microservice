import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authAPI } from '../../src/api/auth';
import FloatingLabelInput from '../../src/components/ui/FloatingLabelInput';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const router = useRouter();

  // Clear error when user starts typing
  const clearErrors = () => {
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
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

  // Enhanced Full name validation function with multi-language support
  const validateFullName = (fullName) => {
    if (!fullName || !fullName.trim()) {
      return { isValid: false, message: 'Vui lòng nhập họ và tên' };
    }

    const trimmedName = fullName.trim();

    if (trimmedName.length < 2) {
      return { isValid: false, message: 'Họ và tên phải có ít nhất 2 ký tự' };
    }

    if (trimmedName.length > 50) {
      return { isValid: false, message: 'Họ và tên không được vượt quá 50 ký tự' };
    }

    const allowedCharactersRegex = /^[a-zA-ZÀ-ỹ\u0100-\u017F\u4e00-\u9fff\s]+$/;
    
    if (!allowedCharactersRegex.test(trimmedName)) {
      return { 
        isValid: false, 
        message: 'Họ và tên chỉ được chứa chữ cái (Tiếng Việt, Tiếng Anh, Latin, Tiếng Trung) và khoảng trắng' 
      };
    }

    if (/\s{2,}/.test(trimmedName)) {
      return { isValid: false, message: 'Họ và tên không được chứa nhiều khoảng trắng liên tiếp' };
    }

    if (trimmedName !== fullName.trim()) {
      return { isValid: false, message: 'Họ và tên không được bắt đầu hoặc kết thúc bằng khoảng trắng' };
    }

    if (trimmedName.replace(/\s/g, '').length === 0) {
      return { isValid: false, message: 'Họ và tên phải chứa ít nhất một chữ cái' };
    }

    const hasValidLetter = /[a-zA-ZÀ-ỹ\u0100-\u017F\u4e00-\u9fff]/.test(trimmedName);
    if (!hasValidLetter) {
      return { isValid: false, message: 'Họ và tên phải chứa ít nhất một chữ cái hợp lệ' };
    }

    return { isValid: true, message: '' };
  };

  // Confirm password validation function
  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return { isValid: false, message: 'Vui lòng xác nhận mật khẩu' };
    }

    if (password !== confirmPassword) {
      return { isValid: false, message: 'Mật khẩu xác nhận không khớp' };
    }

    return { isValid: true, message: '' };
  };

  // Handle real-time input filtering for fullName
  const handleFullNameChange = (text) => {
    clearErrors();
    const filteredText = text.replace(/[^a-zA-ZÀ-ỹ\u0100-\u017F\u4e00-\u9fff\s]/g, '');
    const cleanedText = filteredText.replace(/\s+/g, ' ');
    setFullName(cleanedText);
    
    // Real-time validation
    if (cleanedText) {
      const validation = validateFullName(cleanedText);
      if (!validation.isValid) {
        setFullNameError(validation.message);
      }
    }
  };

  // Handle email input to ensure only Latin characters
  const handleEmailChange = (text) => {
    clearErrors();
    const cleanedText = text.toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
    setEmail(cleanedText);
    
    // Real-time validation
    if (cleanedText) {
      const validation = validateEmail(cleanedText);
      if (!validation.isValid) {
        setEmailError(validation.message);
      }
    }
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (text) => {
    clearErrors();
    setPassword(text);
    
    // Real-time validation
    if (text) {
      const validation = validatePassword(text);
      if (!validation.isValid) {
        setPasswordError(validation.message);
      }
    }
  };

  // Handle confirm password change with real-time validation
  const handleConfirmPasswordChange = (text) => {
    clearErrors();
    setConfirmPassword(text);
    
    // Real-time validation
    if (text) {
      const validation = validateConfirmPassword(password, text);
      if (!validation.isValid) {
        setConfirmPasswordError(validation.message);
      }
    }
  };

  const handleSignup = async () => {
    console.log('📝 Starting signup validation...');

    let hasError = false;

    // Validate all fields
    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.isValid) {
      setFullNameError(fullNameValidation.message);
      hasError = true;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      hasError = true;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
      hasError = true;
    }

    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setConfirmPasswordError(confirmPasswordValidation.message);
      hasError = true;
    }

    if (hasError) {
      Alert.alert('Thông báo', 'Vui lòng sửa các lỗi trước khi tiếp tục');
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
      
      // Clear form after successful signup
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      clearErrors();
      
      // Navigate to profile immediately after successful signup
      console.log('🚀 Navigating to profile...');
      router.replace('/(tabs)/profile');
      
      // Show success message
      setTimeout(() => {
        Alert.alert('🎉 Thành công', result.message || 'Đăng ký thành công!');
      }, 500);
      
    } catch (error) {
      console.log('ℹ️ Signup failed:', error.message);
      
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.message === 'Email đã được sử dụng') {
        errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.';
        setEmailError('Email đã được sử dụng');
      } else if (error.message === 'Dữ liệu không hợp lệ') {
        errorMessage = 'Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (error.userMessage) {
        errorMessage = error.userMessage;
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setLoading(false);
    }
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
          keyboardShouldPersistTaps="handled"
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
                onChangeText={handleFullNameChange}
                autoCapitalize="words"
                placeholder="Nguyễn Văn A / John Smith / 王小明"
                maxLength={50}
                editable={!loading}
                returnKeyType="next"
                errorMessage={fullNameError}
                showCharacterCount={false}
              />
              
              <FloatingLabelInput
                label="Địa chỉ Email (tiếng Anh)"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="example@gmail.com"
                editable={!loading}
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
                textContentType="newPassword"
                maxLength={20}
                editable={!loading}
                returnKeyType="next"
                placeholder="password123 / mậtkhẩu123 / 密码123"
                errorMessage={passwordError}
                showCharacterCount={false}
              />
              
              <FloatingLabelInput
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoComplete="password"
                textContentType="newPassword"
                maxLength={20}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                errorMessage={confirmPasswordError}
                showCharacterCount={false}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
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
              <TouchableOpacity 
                style={styles.loginButton}
                disabled={loading}
              >
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
// Giữ nguyên toàn bộ code, chỉ update styles:

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
    marginBottom: 32, // Giảm từ 40 xuống 32
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
    marginBottom: 16, // Giảm từ 32 xuống 24
  },
  signupButton: {
    backgroundColor: '#059669',
    paddingVertical: 18, // Tăng từ 16 lên 18 để match với input height
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
    marginBottom: 16,
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