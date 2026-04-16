import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { authAPI } from '../src/api/auth';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); 
  const segments = useSegments();
  const router = useRouter();
  
  // 1. Lấy trạng thái khởi tạo của Root Navigation
  const navigationState = useRootNavigationState();

  useEffect(() => {
    const syncAuthThenNavigate = async () => {
      // 2. CHẶN: Nếu Navigation chưa sẵn sàng, không làm gì cả
      if (!navigationState?.key) return;

      try {
        const loggedIn = await authAPI.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';

        // 3. Logic điều hướng
        if (loggedIn && inAuthGroup) {
          router.replace('/(tabs)/index'); // Thường là về trang chủ/index
        } else if (!loggedIn && inTabsGroup) {
          router.replace('/(auth)/login');
        } else if (!loggedIn && !inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setIsLoggedIn(false);
        router.replace('/(auth)/login');
      }
    };

    syncAuthThenNavigate();
  }, [segments, navigationState?.key]); // 4. Theo dõi thêm navigationState?.key

  // 5. Hiển thị màn hình chờ cho đến khi xác định được trạng thái login VÀ navigation sẵn sàng
  if (isLoggedIn === null || !navigationState?.key) {
    return null; 
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}