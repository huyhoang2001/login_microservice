import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authAPI } from '../api/auth';

export default function ConnectionTest() {
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const health = await authAPI.healthCheck();
      Alert.alert('Thành công!', `Server OK: ${health.message}`);
    } catch (error) {
      Alert.alert('Lỗi kết nối', error.userMessage || error.message);
    }
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Đang test...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});