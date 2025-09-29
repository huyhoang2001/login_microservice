//frontend-app\app\(tabs)\_layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#10B981',
        },
        headerTitleStyle: {
          color: 'white',
          fontWeight: 'bold',
        },
        headerTintColor: 'white',
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
          headerTitle: '👤 Thông tin cá nhân',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: '🏠 Trang chủ',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerTitle: '⚙️ Cài đặt',
        }}
      />
    </Tabs>
  );
}