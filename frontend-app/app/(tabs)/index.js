//frontend-app\app\(tabs)\index.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../lib/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authAPI.logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MyApp!</Text>
        
        {user && (
          <View style={styles.userCard}>
            <Text style={styles.cardTitle}>User Information</Text>
            <Text style={styles.userText}>👤 {user.fullName}</Text>
            <Text style={styles.userText}>📧 {user.email}</Text>
          </View>
        )}

        <View style={styles.featuresCard}>
          <Text style={styles.cardTitle}>Features</Text>
          <Text style={styles.featureText}>✅ Secure Authentication</Text>
          <Text style={styles.featureText}>✅ User Profile Management</Text>
          <Text style={styles.featureText}>✅ Responsive Design</Text>
          <Text style={styles.featureText}>✅ Cross Platform (iOS/Android)</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
  },
  userText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  featureText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});