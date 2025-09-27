import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Disable back button để tránh navigation loop
        headerBackVisible: false,
        gestureEnabled: false, // Tắt swipe back gesture
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Đăng Nhập',
          headerShown: false // Ẩn header để có full control
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          title: 'Đăng Ký',
          headerShown: false // Ẩn header để có full control
        }} 
      />
    </Stack>
    
  );
}