import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authAPI } from '../../lib/api/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAPTCHA_WIDTH = Math.min(SCREEN_WIDTH - 40, 300);
const CAPTCHA_HEIGHT = 200;
const PUZZLE_SIZE = 60;

export default function CaptchaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [captchaData, setCaptchaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dragState, setDragState] = useState('idle'); // idle, dragging, success, error
  const [attempts, setAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  // Animation refs
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(23)).current;
  const puzzlePosition = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Tracking refs
  const startTime = useRef(0);
  const movements = useRef([]);
  const maxSlideDistance = CAPTCHA_WIDTH - PUZZLE_SIZE;

  useEffect(() => {
    initializeCaptcha();
    loadUserInfo();
    
    // Handle back button
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const loadUserInfo = async () => {
    try {
      const pendingUser = await AsyncStorage.getItem('pendingUser');
      if (pendingUser) {
        setUserInfo(JSON.parse(pendingUser));
      }
    } catch (error) {
      console.warn('Could not load pending user info');
    }
  };

  const initializeCaptcha = async () => {
    try {
      await loadCaptcha();
    } catch (error) {
      Alert.alert(
        'Lỗi Kết Nối', 
        'Không thể tải captcha. Vui lòng kiểm tra kết nối và thử lại.',
        [
          { text: 'Thử lại', onPress: initializeCaptcha },
          { text: 'Quay lại', onPress: handleBackPress }
        ]
      );
    }
  };

  const loadCaptcha = async () => {
    setIsLoading(true);
    setStatusMessage('Đang tạo captcha...');
    
    try {
      const data = await authAPI.createCaptcha();
      setCaptchaData(data);
      resetSlider();
      setStatusMessage('Kéo mảnh ghép vào vị trí phù hợp');
      setAttempts(0);
      
      // Start pulse animation for puzzle piece
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSlider = () => {
    setDragState('idle');
    sliderPosition.setValue(0);
    progressWidth.setValue(23);
    puzzlePosition.setValue(0);
    shakeAnimation.setValue(0);
    pulseAnimation.setValue(1);
    startTime.current = 0;
    movements.current = [];
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => dragState === 'idle' || dragState === 'dragging',
    
    onPanResponderGrant: (evt) => {
      if (dragState === 'success' || isVerifying) return;
      
      setDragState('dragging');
      startTime.current = Date.now();
      movements.current = [{ 
        x: evt.nativeEvent.pageX, 
        time: 0 
      }];
      setStatusMessage('Đang kéo...');
      
      // Stop pulse animation
      pulseAnimation.stopAnimation();
    },

    onPanResponderMove: (evt, gestureState) => {
      if (dragState !== 'dragging') return;
      
      const newPosition = Math.max(0, Math.min(maxSlideDistance, gestureState.dx));
      const progress = newPosition + 23;
      
      sliderPosition.setValue(newPosition);
      progressWidth.setValue(progress);
      puzzlePosition.setValue(newPosition);
      
      // Record movement for human verification
      movements.current.push({
        x: evt.nativeEvent.pageX,
        time: Date.now() - startTime.current
      });
    },

    onPanResponderRelease: (evt, gestureState) => {
      if (dragState !== 'dragging') return;
      
      const finalPosition = Math.max(0, Math.min(maxSlideDistance, gestureState.dx));
      const totalTime = Date.now() - startTime.current;
      
      verifyCaptcha(finalPosition, totalTime, movements.current);
    },
  });

  const verifyCaptcha = async (position, duration, movementPath) => {
    setIsVerifying(true);
    setStatusMessage('Đang xác thực...');
    
    try {
      const verification = {
        sessionId: captchaData.sessionId,
        dragPath: movementPath,
        finalPosition: position,
        timeTaken: duration
      };
      
      const result = await authAPI.verifyCaptcha(verification);
      
      if (result.success && result.verified) {
        await handleCaptchaSuccess(result.captchaToken);
      } else {
        handleCaptchaFailure(result);
      }
    } catch (error) {
      handleCaptchaError(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCaptchaSuccess = async (captchaToken) => {
    setDragState('success');
    setStatusMessage('✅ Xác thực thành công!');
    
    // Stop all animations
    pulseAnimation.stopAnimation();
    
    // Animate to correct position
    if (captchaData) {
      const targetPosition = captchaData.correctPosition || maxSlideDistance;
      
      Animated.parallel([
        Animated.timing(sliderPosition, {
          toValue: targetPosition,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(puzzlePosition, {
          toValue: targetPosition,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(progressWidth, {
          toValue: targetPosition + 23,
          duration: 400,
          useNativeDriver: false,
        })
      ]).start();
    }
    
    // Complete authentication flow
    setTimeout(() => {
      completeCaptchaFlow(captchaToken);
    }, 1200);
  };

  const handleCaptchaFailure = (result) => {
    setDragState('error');
    setAttempts(prev => prev + 1);
    
    let errorMsg = 'Xác thực thất bại';
    if (result.errors) {
      if (result.errors.accuracy) {
        errorMsg = 'Vị trí chưa chính xác, hãy thử lại';
      } else if (result.errors.behavior) {
        errorMsg = 'Vui lòng kéo một cách tự nhiên hơn';
      } else if (result.errors.duration) {
        errorMsg = 'Thời gian di chuyển không phù hợp';
      }
    }
    
    setStatusMessage(`❌ ${errorMsg}`);
    
    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    setTimeout(() => {
      if (attempts >= 2) {
        // Too many attempts, reload captcha
        Alert.alert(
          'Quá nhiều lần thử', 
          'Hệ thống sẽ tạo captcha mới cho bạn.',
          [{ text: 'OK', onPress: loadCaptcha }]
        );
      } else {
        resetSlider();
        setStatusMessage('Hãy thử lại - Kéo mảnh ghép vào vị trí phù hợp');
      }
    }, 2000);
  };

  const handleCaptchaError = (error) => {
    setDragState('error');
    setStatusMessage('❌ Lỗi kết nối, vui lòng thử lại');
    
    setTimeout(() => {
      resetSlider();
      setStatusMessage('Kéo mảnh ghép vào vị trí phù hợp');
    }, 3000);
  };

  const completeCaptchaFlow = async (captchaToken) => {
    try {
      setStatusMessage('Đang hoàn tất xác thực...');
      
      // Upgrade temp token to full token
      const result = await authAPI.upgradeToken(captchaToken);
      
      if (result.success) {
        // Store full authentication data
        await AsyncStorage.setItem('token', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        
        // Clear temp data
        await AsyncStorage.multiRemove(['tempAuthToken', 'pendingUser']);
        
        setStatusMessage('🎉 Đăng nhập thành công!');
        
        // Navigate to profile with animation
        setTimeout(() => {
          router.replace('/(tabs)/profile');
        }, 800);
      } else {
        throw new Error(result.error || 'Xác thực thất bại');
      }
      
    } catch (error) {
      Alert.alert(
        'Lỗi Xác Thực', 
        'Có lỗi xảy ra trong quá trình xác thực. Vui lòng đăng nhập lại.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn quay lại? Quá trình xác thực sẽ bị hủy.',
      [
        { text: 'Ở lại', style: 'cancel' },
        { 
          text: 'Quay lại', 
          style: 'destructive',
          onPress: () => {
            AsyncStorage.multiRemove(['tempAuthToken', 'pendingUser']);
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const getSliderText = () => {
    switch (dragState) {
      case 'dragging': return 'Đang kéo...';
      case 'success': return 'Hoàn thành! 🎉';
      case 'error': return 'Thử lại';
      default: return 'Kéo để xác thực';
    }
  };

  const getSliderIcon = () => {
    if (isVerifying) return null;
    switch (dragState) {
      case 'success': return '✓';
      case 'error': return '✗';
      default: return '⟷';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tạo captcha...</Text>
        <Text style={styles.loadingSubtext}>Vui lòng đợi trong giây lát</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f5f7" />
      <View style={styles.container}>
        {/* Header with user info */}
        {userInfo && (
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>Xin chào, {userInfo.name}</Text>
            <Text style={styles.stepText}>Bước cuối: Xác thực bảo mật</Text>
          </View>
        )}

        <Animated.View style={[
          styles.captchaCard,
          { transform: [{ translateX: shakeAnimation }] }
        ]}>
          <View style={styles.cardHeader}>
            <Text style={styles.headerText}>🛡️ Xác thực bảo mật</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={loadCaptcha}
              disabled={dragState === 'dragging' || isVerifying}
            >
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.instructionText}>
              Kéo mảnh ghép vào vị trí phù hợp để hoàn tất đăng nhập
            </Text>
            
            <View style={styles.captchaContainer}>
              {/* Background Canvas with Hole */}
              <View style={styles.backgroundCanvas}>
                {captchaData?.backgroundImage && (
                  <Image
                    source={{ uri: captchaData.backgroundImage }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                  />
                )}
                {isLoading && (
                  <View style={styles.canvasLoading}>
                    <ActivityIndicator color="#3b82f6" />
                  </View>
                )}
              </View>
              
              {/* Puzzle Piece */}
              <Animated.View
                style={[
                  styles.puzzlePiece,
                  {
                    left: puzzlePosition,
                    top: captchaData?.puzzleY || 70,
                    transform: [{ scale: pulseAnimation }]
                  }
                ]}
              >
                {captchaData?.puzzleImage && (
                  <Image
                    source={{ uri: captchaData.puzzleImage }}
                    style={styles.puzzleImage}
                    resizeMode="contain"
                  />
                )}
              </Animated.View>
              
              {/* Slider Track */}
              <View style={[
                styles.sliderTrack,
                dragState === 'success' && styles.successTrack,
                dragState === 'error' && styles.errorTrack,
              ]}>
                <Animated.View 
                  style={[
                    styles.sliderProgress,
                    { width: progressWidth },
                    dragState === 'success' && styles.successProgress,
                    dragState === 'error' && styles.errorProgress,
                  ]} 
                />
                
                <Animated.View
                  style={[
                    styles.sliderButton,
                    { left: Animated.add(sliderPosition, 2) },
                    dragState === 'success' && styles.successButton,
                    dragState === 'error' && styles.errorButton,
                    isVerifying && styles.disabledButton,
                  ]}
                  {...(isVerifying ? {} : panResponder.panHandlers)}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.sliderIcon,
                      dragState === 'success' && styles.successIcon,
                      dragState === 'error' && styles.errorIcon,
                    ]}>
                      {getSliderIcon()}
                    </Text>
                  )}
                </Animated.View>
                
                <Text style={[
                  styles.sliderText,
                  dragState === 'dragging' && styles.hiddenText
                ]}>
                  {getSliderText()}
                </Text>
              </View>
            </View>
            
            {/* Status and Progress */}
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusLine,
                dragState === 'success' && styles.successStatus,
                dragState === 'error' && styles.errorStatus,
              ]}>
                {statusMessage}
              </Text>

              <View style={styles.progressInfo}>
                <Text style={styles.attemptCounter}>
                  Lần thử: {attempts + 1}/3
                </Text>
                <Text style={styles.timeInfo}>
                  ⏱️ Thời gian: {isVerifying ? 'Đang xử lý...' : 'Sẵn sàng'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          disabled={isVerifying}
        >
          <Text style={styles.backButtonText}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
        
        {/* Help Text */}
        <Text style={styles.helpText}>
          💡 Kéo mảnh ghép một cách tự nhiên để tránh bị phát hiện là bot
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  stepText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  captchaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
    maxWidth: 360,
  },
  cardHeader: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  refreshIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
  cardBody: {
    padding: 24,
  },
  instructionText: {
    textAlign: 'center',
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  captchaContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  backgroundCanvas: {
    width: CAPTCHA_WIDTH,
    height: CAPTCHA_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  canvasLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
  },
  puzzlePiece: {
    position: 'absolute',
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    zIndex: 2,
  },
  puzzleImage: {
    width: '100%',
    height: '100%',
  },
  sliderTrack: {
    marginTop: 20,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    position: 'relative',
    width: '100%',
  },
  successTrack: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  errorTrack: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  sliderProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 24,
  },
  successProgress: {
    backgroundColor: '#10b981',
  },
  errorProgress: {
    backgroundColor: '#ef4444',
  },
  sliderButton: {
    position: 'absolute',
    top: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 3,
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.7,
  },
  sliderIcon: {
    fontSize: 18,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  successIcon: {
    color: '#ffffff',
  },
  errorIcon: {
    color: '#ffffff',
  },
  sliderText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -9 }],
    color: '#6b7280',
    fontSize: 14,
    pointerEvents: 'none',
    textAlign: 'center',
    fontWeight: '500',
  },
  hiddenText: {
    opacity: 0,
  },
  statusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusLine: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    minHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  successStatus: {
    color: '#10b981',
  },
  errorStatus: {
    color: '#ef4444',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  attemptCounter: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timeInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    marginTop: 12,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});