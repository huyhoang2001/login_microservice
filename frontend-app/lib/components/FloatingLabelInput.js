import React, { useState, useRef } from 'react';
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
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

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

  const labelStyle = {
    position: 'absolute',
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 8],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9CA3AF', isFocused ? '#10B981' : '#6B7280'],
    }),
    fontWeight: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['400', '600'],
    }),
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: isFocused ? '#10B981' : (value ? '#6B7280' : '#E5E7EB'),
      shadowColor: isFocused ? '#10B981' : 'transparent',
      shadowOpacity: isFocused ? 0.2 : 0,
      shadowRadius: isFocused ? 8 : 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: isFocused ? 4 : 0,
    },
    style,
  ];

  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle}>
        {label}
      </Animated.Text>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="transparent"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

export default FloatingLabelInput;