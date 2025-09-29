import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  placeholder,
  editable = true,
  maxLength,
  returnKeyType = 'default',
  onSubmitEditing,
  multiline = false,
  numberOfLines = 1,
  errorMessage,
  showCharacterCount = false,
  style,
  inputStyle,
  labelStyle,
  errorTextStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (value && !isFocused) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!value && !isFocused) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const animatedLabelStyle = {
    position: 'absolute',
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 8],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9CA3AF', errorMessage ? '#EF4444' : (isFocused ? '#10B981' : '#6B7280')],
    }),
    fontWeight: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['400', '600'],
    }),
    backgroundColor: '#f7f9fb', // Match your background
    paddingHorizontal: 4,
    zIndex: 1,
    pointerEvents: 'none',
  };

  const inputHeight = multiline ? Math.max(60, numberOfLines * 20 + 40) : 60;
  
  const dynamicInputStyle = [
    styles.input,
    {
      borderColor: errorMessage 
        ? '#EF4444' 
        : (isFocused ? '#10B981' : (value ? '#6B7280' : '#E5E7EB')),
      shadowColor: errorMessage 
        ? '#EF4444' 
        : (isFocused ? '#10B981' : '#000'),
      shadowOpacity: (isFocused || errorMessage) ? 0.15 : 0.05,
      shadowRadius: (isFocused || errorMessage) ? 12 : 4,
      shadowOffset: { width: 0, height: (isFocused || errorMessage) ? 4 : 2 },
      elevation: (isFocused || errorMessage) ? 6 : 2,
      backgroundColor: editable ? 'white' : '#F9FAFB',
      color: editable ? '#1F2937' : '#9CA3AF',
      height: inputHeight,
      paddingTop: multiline ? 20 : 12,
      paddingBottom: multiline ? 16 : 12,
      textAlignVertical: multiline ? 'top' : 'center',
      minHeight: 60,
    },
    inputStyle,
    style,
  ];

  return (
    <View style={[styles.container, { minHeight: inputHeight + (errorMessage ? 24 : 4) }]}>
      <Animated.Text style={[animatedLabelStyle, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={dynamicInputStyle}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        placeholder={isFocused ? placeholder : ''}
        placeholderTextColor="#9CA3AF"
        editable={editable}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        {...props}
      />
      {errorMessage && (
        <Text style={[styles.errorText, errorTextStyle]}>
          {errorMessage}
        </Text>
      )}
      {showCharacterCount && maxLength && (
        <Text style={styles.characterCount}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 13, // Spacing phù hợp với design system
  },
  input: {
    height: 60, // Tăng từ 56 lên 60 để match với design
    borderWidth: 2,
    borderRadius: 12, // Match với button borderRadius
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#1F2937', // Match với title color
    backgroundColor: 'white',
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  characterCount: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
    marginRight: 4,
  },
});

export default FloatingLabelInput;