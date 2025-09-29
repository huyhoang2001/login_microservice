import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// 📍 THAY THẾ: Các constants cũ (dòng 16-20)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 🎯 Auto Responsive Constants
const isSmallScreen = screenWidth < 360;
const isMediumScreen = screenWidth >= 360 && screenWidth < 400;
const isLargeScreen = screenWidth >= 400;

// Dynamic sizing based on screen
const CAPTCHA_WIDTH = isSmallScreen ? 240 : isMediumScreen ? 280 : 300;
const CAPTCHA_HEIGHT = isSmallScreen ? 140 : isMediumScreen ? 160 : 180;
const PUZZLE_SIZE = isSmallScreen ? 40 : isMediumScreen ? 50 : 55;

// Container responsive width
const getContainerWidth = () => {
  if (isSmallScreen) return Math.min(screenWidth - 40, 280);
  if (isMediumScreen) return Math.min(screenWidth - 40, 320);
  return Math.min(screenWidth - 40, 360);
};

// Dynamic padding
const getBodyPadding = () => isSmallScreen ? 12 : isMediumScreen ? 16 : 20;

// Dynamic heights
const getMinHeight = () => isSmallScreen ? 240 : isMediumScreen ? 280 : 300;
const getLoadingHeight = () => isSmallScreen ? 200 : isMediumScreen ? 240 : 260;

export default function SliderCaptcha({ visible, onSuccess, onClose, apiBase }) {
  const [loading, setLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [sliderText, setSliderText] = useState('Kéo sang phải để khớp hình');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [apiError, setApiError] = useState(false);

  const captchaDataRef = useRef(null);
  const puzzleXRef = useRef(0);
  const puzzleYRef = useRef(0);
  const currentXRef = useRef(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const progressScale = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isDragging = useRef(false);
  const startX = useRef(0);
  const humanBehavior = useRef({
    movements: [],
    startTime: 0,
    totalTime: 0,
  });

  const options = {
    tolerancePercent: { min: 80, max: 99.5 },
    minDuration: 300,
    maxDuration: 12000,
  };

  useEffect(() => {
    captchaDataRef.current = captchaData;
  }, [captchaData]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      resetSlider();
      loadCaptcha();
    } else {
      fadeAnim.setValue(0);
      resetSlider();

      setTimeout(() => {
        setCaptchaData(null);
      }, 100);
    }
  }, [visible]);

  const loadCaptcha = async () => {
    if (loading) {
      console.log('🔄 Already loading captcha, skipping...');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setStatusMessage('');
    setSliderText('Kéo sang phải để khớp hình');
    setImageLoadError(false);
    setApiError(false);
    resetSlider();

    try {
      console.log('🔄 Loading captcha from:', `${apiBase}/captcha/generate`);

      const response = await fetch(`${apiBase}/captcha/generate`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Raw captcha data received:', data);

      const baseUrlWithoutApi = apiBase.replace('/api', '');
      data.backgroundImage = `${baseUrlWithoutApi}${data.backgroundImage}`;
      data.puzzleImage = `${baseUrlWithoutApi}${data.puzzleImage}`;

      puzzleXRef.current = data.puzzleX || Math.random() * (CAPTCHA_WIDTH - 140) + 70;
      puzzleYRef.current = data.puzzleY || Math.random() * (CAPTCHA_HEIGHT - 120) + 40;

      const processedData = {
        ...data,
        puzzleX: puzzleXRef.current,
        puzzleY: puzzleYRef.current,
      };

      console.log('🎯 Setting captcha data with sessionId:', processedData.sessionId);
      setCaptchaData(processedData);
    } catch (error) {
      console.error('❌ Captcha load error:', error);
      setApiError(true);
      setStatusMessage('Không thể tải captcha');
    } finally {
      setLoading(false);
    }
  };

  const resetInteractionState = () => {
    isDragging.current = false;
    startX.current = 0;
    currentXRef.current = 0;
    humanBehavior.current = {
      movements: [],
      startTime: 0,
      totalTime: 0,
    };
  };

  const resetSlider = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setStatus('idle');
    setStatusMessage('');
    setSliderText('Kéo sang phải để khớp hình');
    resetInteractionState();
  };

  const updateSliderPosition = (positionX) => {
    const maxDistance = CAPTCHA_WIDTH - PUZZLE_SIZE;
    const percent = positionX / maxDistance;

    translateX.setValue(positionX);
    progressScale.setValue(percent);
  };

  const calculateAccuracy = () => {
    const targetX = puzzleXRef.current;
    const pieceRight = currentXRef.current + PUZZLE_SIZE;
    const holeLeft = targetX;
    const holeRight = targetX + PUZZLE_SIZE;

    if (pieceRight < holeLeft) return 0;
    if (currentXRef.current > holeRight) return 0;

    const overlapStart = Math.max(currentXRef.current, holeLeft);
    const overlapEnd = Math.min(pieceRight, holeRight);
    const overlapWidth = overlapEnd - overlapStart;

    return (overlapWidth / PUZZLE_SIZE) * 100;
  };

  const checkAccuracy = (accuracy) => {
    if (accuracy >= 99.5) return false;
    return accuracy >= options.tolerancePercent.min;
  };

  const checkDuration = () => {
    const duration = humanBehavior.current.totalTime;
    return duration >= options.minDuration && duration <= options.maxDuration;
  };

  const verifyHumanBehavior = () => {
    const { movements, totalTime } = humanBehavior.current;

    if (movements.length < 3) return false;
    if (movements.length < 5 && totalTime > 800) return true;

    let totalVariation = 0;
    let validPairs = 0;

    for (let i = 1; i < movements.length - 1; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      const next = movements[i + 1];

      const timeDiff1 = curr.time - prev.time;
      const timeDiff2 = next.time - curr.time;

      if (timeDiff1 < 1 || timeDiff2 < 1) continue;

      const velocity1 = (curr.x - prev.x) / timeDiff1;
      const velocity2 = (next.x - curr.x) / timeDiff2;

      totalVariation += Math.abs(velocity2 - velocity1);
      validPairs++;
    }

    if (validPairs < 2) return true;

    const avgVariation = totalVariation / validPairs;
    const variationIsHuman = avgVariation > 0.01 && avgVariation < 20;

    const hasErraticJump = movements.some((step, idx) => {
      if (idx === 0) return false;
      const jump = Math.abs(step.x - movements[idx - 1].x);
      const timeGap = step.time - movements[idx - 1].time;
      return jump > 100 && timeGap < 20;
    });

    return variationIsHuman && !hasErraticJump;
  };

  const animateToPosition = (targetX) => {
    const maxDistance = CAPTCHA_WIDTH - PUZZLE_SIZE;
    const targetPercent = targetX / maxDistance;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        useNativeDriver: true,
      }),
      Animated.spring(progressScale, {
        toValue: targetPercent,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSuccess = () => {
    setStatus('success');
    setSliderText('Xác thực thành công!');
    setStatusMessage('✓ Hoàn thành xác thực');
    animateToPosition(puzzleXRef.current);

    setTimeout(() => {
      const captchaResult = {
        sessionId: (captchaData || captchaDataRef.current)?.sessionId,
        positionX: currentXRef.current,
        duration: humanBehavior.current.totalTime,
        verified: true,
      };
      onSuccess(captchaResult);
    }, 800);
  };

  const showError = (accuracy, flags) => {
  const { isAccuracyValid, isHumanLike, isDurationValid } = flags;
  setStatus('error');

  if (!isDurationValid) {
    setSliderText('Thời gian không hợp lệ — thử lại');
  } else if (!isAccuracyValid && accuracy >= 99.5) {
    setSliderText('Quá chính xác. Thử lại.');
  } else if (!isHumanLike) {
    setSliderText('Phát hiện bot — thử lại');
  } else {
    setSliderText('Vị trí sai. Thử lại.');
  }

  // 🔄 Reset TRỰC TIẾP về 0 - không animation
  translateX.setValue(0);
  progressScale.setValue(0);
  currentXRef.current = 0;
  resetInteractionState();

  // 🚀 Load captcha mới
  console.log('🔄 Loading new captcha immediately after error...');
  setTimeout(() => {
    loadCaptcha();
  }, 200);
};

  const verifyLocal = () => {
    console.log('🔍 Starting local verification...');
    console.log('📊 captchaData state:', captchaData ? 'Available' : 'NULL');
    console.log('📊 captchaDataRef:', captchaDataRef.current ? 'Available' : 'NULL');

    const accuracy = calculateAccuracy();
    const isAccuracyValid = checkAccuracy(accuracy);
    const isHumanLike = verifyHumanBehavior();
    const isDurationValid = checkDuration();

    console.log('📊 Local verification results:', {
      accuracy: accuracy.toFixed(2),
      isAccuracyValid,
      isHumanLike,
      isDurationValid,
      hasCaptchaData: !!(captchaData || captchaDataRef.current),
    });

    if (isAccuracyValid && isHumanLike && isDurationValid) {
      const dataToUse = captchaData || captchaDataRef.current;

      if (!dataToUse) {
        console.error('❌ Both captchaData and ref are null');
        setStatusMessage('Lỗi dữ liệu captcha - tải lại');
        setTimeout(() => loadCaptcha(), 1000);
        return;
      }

      console.log('✅ Using captcha data:', dataToUse.sessionId);
      verifyCaptcha(dataToUse);
    } else {
      showError(accuracy, { isAccuracyValid, isHumanLike, isDurationValid });
    }
  };

  const verifyCaptcha = async (dataToUse = null) => {
    const captchaInfo = dataToUse || captchaData || captchaDataRef.current;

    if (!captchaInfo) {
      console.error('❌ No captcha data available');
      setStatusMessage('Lỗi dữ liệu captcha');
      resetSlider();
      return;
    }

    if (!captchaInfo.sessionId) {
      console.error('❌ sessionId missing:', captchaInfo);
      setStatusMessage('Lỗi session captcha');
      resetSlider();
      return;
    }

    try {
      console.log('🔍 Verifying with sessionId:', captchaInfo.sessionId);

      const response = await fetch(`${apiBase}/captcha/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sessionId: captchaInfo.sessionId,
          positionX: currentXRef.current,
          duration: humanBehavior.current.totalTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Server verification result:', result);

      if (result.valid) {
        showSuccess();
      } else {
        showError(result.accuracy || 0, {
          isAccuracyValid: result.isAccuracyValid || false,
          isHumanLike: result.isHumanLike || false,
          isDurationValid: result.isDurationValid || false,
        });
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setStatusMessage('Lỗi xác thực server');
      showError(0, {
        isAccuracyValid: false,
        isHumanLike: true,
        isDurationValid: true,
      });
    }
  };

  const handleImageError = (type) => {
    console.error(`❌ ${type} image loading failed`);
    setImageLoadError(true);
    setStatusMessage(`Lỗi tải ${type.toLowerCase()}`);

    setTimeout(() => {
      console.log('🔄 Auto retrying after image error...');
      loadCaptcha();
    }, 2000);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        resetInteractionState();
        isDragging.current = true;
        startX.current = evt.nativeEvent.locationX;

        humanBehavior.current.startTime = Date.now();
        humanBehavior.current.movements.push({
          x: evt.nativeEvent.pageX,
          time: 0,
        });

        setStatusMessage('');
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!isDragging.current || status !== 'idle') return;

        const maxDistance = CAPTCHA_WIDTH - PUZZLE_SIZE;
        const deltaX = gestureState.dx;
        currentXRef.current = Math.max(0, Math.min(maxDistance, deltaX));

        updateSliderPosition(currentXRef.current);

        humanBehavior.current.movements.push({
          x: evt.nativeEvent.pageX,
          time: Date.now() - humanBehavior.current.startTime,
        });
      },

      onPanResponderRelease: () => {
        if (!isDragging.current || status !== 'idle') return;

        isDragging.current = false;
        humanBehavior.current.totalTime = Date.now() - humanBehavior.current.startTime;

        verifyLocal();
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Xác thực bảo mật</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('🔄 Manual refresh triggered');
                loadCaptcha();
              }}
              style={[
                styles.refreshBtn,
                (loading || status === 'success') && styles.refreshBtnDisabled,
              ]}
              disabled={loading || status === 'success'}
            >
              <Ionicons
                name="refresh"
                size={isSmallScreen ? 16 : 20} // ← THÊM DÒNG NÀY
                color={loading ? '#9ca3af' : 'white'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Đang tải captcha...</Text>
              </View>
            ) : apiError || imageLoadError ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name={apiError ? 'cloud-offline' : 'image'}
                  size={48}
                  color="#ef4444"
                />
                <Text style={styles.errorText}>{statusMessage || 'Không thể tải captcha'}</Text>
                <TouchableOpacity onPress={loadCaptcha} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : captchaData ? (
              <>
                <View style={styles.captchaContainer}>
                  <Image
                    source={{ uri: captchaData.backgroundImage }}
                    style={styles.backgroundImage}
                    onError={() => handleImageError('background')}
                    resizeMode="cover"
                  />

                  <Animated.View
                    style={[
                      styles.puzzlePiece,
                      {
                        transform: [{ translateX }],
                        top: captchaData.puzzleY,
                      },
                    ]}
                  >
                    <View style={styles.puzzlePieceInner}>
                      <Image
                        source={{ uri: captchaData.puzzleImage }}
                        style={[styles.puzzleImage, { tintColor: 'rgba(255, 255, 255, 7)' }]}
                        onError={() => handleImageError('puzzle')}
                        resizeMode="contain"
                      />
                    </View>
                  </Animated.View>

                  <View
                    style={[
                      styles.puzzleHole,
                      {
                        left: captchaData.puzzleX,
                        top: captchaData.puzzleY,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Image
                      source={{ uri: captchaData.puzzleImage }}
                      style={[styles.puzzleImage, { tintColor: 'rgba(255, 255, 255, 7)' }]}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.sliderTrack,
                    status === 'success' && styles.sliderTrackSuccess,
                    status === 'error' && styles.sliderTrackError,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.sliderProgress,
                      {
                        transform: [
                          {
                            scaleX: progressScale.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }),
                          },
                        ],
                      },
                      status === 'success' && styles.sliderProgressSuccess,
                      status === 'error' && styles.sliderProgressError,
                    ]}
                  />

                  <Text
                    style={[
                      styles.sliderText,
                      (status !== 'idle' || translateX._value > 10) && styles.sliderTextHidden,
                    ]}
                  >
                    {sliderText}
                  </Text>

                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.sliderButton,
                      { transform: [{ translateX }] },
                      status === 'success' && styles.sliderButtonSuccess,
                      status === 'error' && styles.sliderButtonError,
                    ]}
                  >
                   <Ionicons
                      name={
                        status === 'success'
                          ? 'checkmark-outline'
                          : status === 'error'
                          ? 'close-outline'
                          : 'swap-horizontal-outline'
                      }
                      size={isSmallScreen ? 18 : isMediumScreen ? 20 : 24} // ← THAY THẾ DÒNG NÀY
                      color={status !== 'idle' ? '#ffffff' : '#4b5563'}
                    />
                  </Animated.View>
                </View>

                {statusMessage !== '' && (
                  <Text
                    style={[
                      styles.statusLine,
                      status === 'success' && styles.statusLineSuccess,
                      status === 'error' && styles.statusLineError,
                    ]}
                  >
                    {statusMessage}
                  </Text>
                )}
              </>
            ) : null}
          </View>

          {!loading && status !== 'success' && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Hủy</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// 📍 VỊ TRÍ: Cuối file SliderCaptcha.js, thay thế toàn bộ phần styles cũ
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: getContainerWidth(),
    maxWidth: screenWidth - 40,
    backgroundColor: 'white',
    borderRadius: isSmallScreen ? 12 : 16,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingVertical: isSmallScreen ? 12 : 16,
    paddingHorizontal: getBodyPadding(),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: isSmallScreen ? 15 : isMediumScreen ? 16 : 17,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: isSmallScreen ? 6 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: isSmallScreen ? 6 : 8,
  },
  refreshBtnDisabled: {
    opacity: 0.5,
  },
  body: {
    padding: getBodyPadding(),
    minHeight: getMinHeight(),
  },
  loadingContainer: {
    height: getLoadingHeight(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: isSmallScreen ? 12 : 14,
  },
  errorContainer: {
    height: getLoadingHeight(),
    justifyContent: 'center',
    alignItems: 'center',
    padding: getBodyPadding(),
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    fontSize: isSmallScreen ? 14 : 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingVertical: isSmallScreen ? 8 : 10,
    backgroundColor: '#3b82f6',
    borderRadius: isSmallScreen ? 6 : 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: isSmallScreen ? 14 : 16,
  },
  
  // 📱 Captcha Responsive Styles
  captchaContainer: {
    width: CAPTCHA_WIDTH,
    height: CAPTCHA_HEIGHT,
    alignSelf: 'center',
    borderRadius: isSmallScreen ? 8 : 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  puzzlePiece: {
    position: 'absolute',
    left: 0,
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    zIndex: 10,
  },
  puzzlePieceInner: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: isSmallScreen ? 2 : 4,
      height: isSmallScreen ? 2 : 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: isSmallScreen ? 4 : 6,
    elevation: isSmallScreen ? 6 : 10,
    backgroundColor: 'transparent',
  },
  puzzleHole: {
    position: 'absolute',
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
  },
  puzzleImage: {
    width: '100%',
    height: '100%',
  },
  
  // 🎛️ Slider Responsive Styles
  sliderTrack: {
  marginTop: isSmallScreen ? 10 : isMediumScreen ? 12 : 16,
  height: isSmallScreen ? 44 : isMediumScreen ? 49 : 54, // 🔄 Tăng thêm 4px
  backgroundColor: '#f3f4f6',
  borderRadius: isSmallScreen ? 22 : isMediumScreen ? 24.5 : 27, // 🔄 Cập nhật theo height/2
  borderWidth: 2,
  borderColor: '#e5e7eb',
  overflow: 'hidden',
  position: 'relative',
},
  sliderTrackSuccess: {
    borderColor: '#22c55e',
    backgroundColor: '#ecfdf3',
  },
  sliderTrackError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  sliderProgress: {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: CAPTCHA_WIDTH - 4,
  backgroundColor: '#60a5fa',
  borderRadius: isSmallScreen ? 20 : isMediumScreen ? 22.5 : 25, // 🔄 Cập nhật = borderRadius - 2
  transformOrigin: 'left center',
},
  sliderProgressSuccess: {
    backgroundColor: '#22c55e',
  },
  sliderProgressError: {
    backgroundColor: '#ef4444',
  },
  sliderText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: isSmallScreen ? -70 : isMediumScreen ? -75 : -80 }, 
      { translateY: isSmallScreen ? -8 : -10 }
    ],
    color: '#6b7280',
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
  },
  sliderTextHidden: {
    opacity: 0,
  },
  sliderButton: {
  position: 'absolute',
  top: isSmallScreen ? 4 : isMediumScreen ? 4 : 4, // 🎯 Căn giữa = (trackHeight - buttonHeight) / 2
  left: 2,
  width: isSmallScreen ? 36 : isMediumScreen ? 41 : 46,
  height: isSmallScreen ? 36 : isMediumScreen ? 41 : 46,
  borderRadius: isSmallScreen ? 18 : isMediumScreen ? 20.5 : 23,
  backgroundColor: '#ffffff',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
  zIndex: 10,
},
  sliderButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  sliderButtonError: {
    backgroundColor: '#ef4444',
  },
  statusLine: {
    marginTop: isSmallScreen ? 8 : 12,
    fontSize: isSmallScreen ? 11 : 13,
    color: '#6b7280',
    textAlign: 'center',
    minHeight: isSmallScreen ? 16 : 18,
  },
  statusLineSuccess: {
    color: '#22c55e',
  },
  statusLineError: {
    color: '#ef4444',
  },
  closeBtn: {
    paddingVertical: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeBtnText: {
    color: '#6b7280',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
  },
});